import type { PrismaClient } from "@/libs/prisma-client";
import { chunk, EmbeddingError, logger } from "@/utils";

export class EmbeddingsService {
	constructor(
		private ai: Ai,
		private prisma: PrismaClient,
		private embeddingModel: string,
	) {}

	/**
	 * Build rich contextual text for disease embedding
	 * İsim + Açıklama + İlişkisel Bağlam (kategori, semptomlar, tanı kriterleri, tedaviler)
	 */
	private async buildRichDiseaseContext(disease: {
		id: number;
		name: string;
		description: string | null;
	}): Promise<string> {
		try {
			// Hastalık detaylarını al (kategori, semptomlar, tanı kriterleri, tedaviler)
			const diseaseDetails = await this.prisma.diseases.findUnique({
				where: { id: disease.id },
				include: {
					category: {
						select: {
							name: true,
						},
					},
					symptoms: {
						include: {
							symptom: {
								select: {
									id: true,
									name: true,
								},
							},
						},
						orderBy: {
							importance: "desc",
						},
						take: 5, // Top 5 en önemli semptom
					},
					diagnosis_criterions: {
						where: {
							type: "positive",
						},
						orderBy: {
							priority: "asc",
						},
						take: 3, // Top 3 tanı kriteri
					},
					treatments: {
						include: {
							dosages: {
								include: {
									medication: {
										select: {
											generic_name: true,
											type: true,
										},
									},
								},
								take: 3, // Her tedavi için top 3 doz
							},
						},
						orderBy: {
							priority: "asc",
						},
						take: 5, // Top 5 tedavi protokolü
					},
				},
			});

			if (!diseaseDetails) {
				// Fallback: sadece isim ve açıklama
				return disease.description
					? `${disease.name}: ${disease.description}`
					: disease.name;
			}

			// Zengin context oluştur
			const parts: string[] = [];

			// 1. Temel bilgiler
			parts.push(`Hastalık: ${disease.name}`);

			if (diseaseDetails.category) {
				parts.push(`Kategori: ${diseaseDetails.category.name}`);
			}

			if (disease.description) {
				parts.push(`Açıklama: ${disease.description}`);
			}

			// 2. Ana semptomlar
			if (diseaseDetails.symptoms.length > 0) {
				const primarySymptoms = diseaseDetails.symptoms
					.filter((ds) => ds.is_primary)
					.map((ds) => `${ds.symptom.name} (önem: ${ds.importance})`)
					.join(", ");

				const secondarySymptoms = diseaseDetails.symptoms
					.filter((ds) => !ds.is_primary)
					.slice(0, 3)
					.map((ds) => ds.symptom.name)
					.join(", ");

				if (primarySymptoms) {
					parts.push(`Ana semptomlar: ${primarySymptoms}`);
				}

				if (secondarySymptoms) {
					parts.push(`Diğer semptomlar: ${secondarySymptoms}`);
				}
			}

			// 3. Tanı kriterleri
			if (diseaseDetails.diagnosis_criterions.length > 0) {
				const criteria = diseaseDetails.diagnosis_criterions
					.map((dc) => dc.criteria)
					.join(". ");
				parts.push(`Tanı kriterleri: ${criteria}`);
			}

			// 4. Tedavi bilgileri (ilaç tipleri ve generic isimler)
			if (diseaseDetails.treatments.length > 0) {
				// Tedavi tiplerini topla (antibiyotik, semptomatik, vb.)
				const treatmentTypes = new Set<string>();
				const medications: string[] = [];

				for (const treatment of diseaseDetails.treatments) {
					if (treatment.type) {
						treatmentTypes.add(treatment.type);
					}

					// İlaç bilgilerini topla
					for (const dosage of treatment.dosages) {
						if (dosage.medication) {
							const medInfo = `${dosage.medication.generic_name} (${dosage.medication.type})`;
							if (!medications.includes(medInfo)) {
								medications.push(medInfo);
							}
						}
					}
				}

				// Tedavi tiplerini ekle
				if (treatmentTypes.size > 0) {
					parts.push(
						`Tedavi tipleri: ${Array.from(treatmentTypes).join(", ")}`,
					);
				}

				// İlaçları ekle (maksimum 5 ilaç)
				if (medications.length > 0) {
					const topMedications = medications.slice(0, 5).join(", ");
					parts.push(`Kullanılan ilaçlar: ${topMedications}`);
				}
			}

			return parts.filter((p) => p).join(". ");
		} catch (error) {
			logger.error(
				{ error, diseaseId: disease.id },
				"Error building rich disease context",
			);
			// Fallback
			return disease.description
				? `${disease.name}: ${disease.description}`
				: disease.name;
		}
	}

	/**
	 * Build rich contextual text for symptom embedding
	 * İsim + Açıklama + İlişkisel Bağlam (ilişkili hastalıklar)
	 */
	private async buildRichSymptomContext(symptom: {
		id: number;
		name: string;
		description: string | null;
	}): Promise<string> {
		try {
			// İlişkili hastalıkları al
			const relatedDiseases = await this.prisma.disease_symptoms.findMany({
				where: {
					symptom_id: symptom.id,
				},
				include: {
					disease: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: {
					importance: "desc",
				},
				take: 5, // Top 5 ilişkili hastalık
			});

			if (relatedDiseases.length === 0) {
				// Fallback: sadece isim ve açıklama
				return symptom.description
					? `${symptom.name}: ${symptom.description}`
					: symptom.name;
			}

			// Zengin context oluştur
			const parts: string[] = [];

			// 1. Temel bilgiler
			parts.push(`Semptom: ${symptom.name}`);

			if (symptom.description) {
				parts.push(`Açıklama: ${symptom.description}`);
			}

			// 2. İlişkili hastalıkları kategorize et
			const primaryDiseases = relatedDiseases
				.filter((rd) => rd.is_primary)
				.map((rd) => rd.disease.name);

			const secondaryDiseases = relatedDiseases
				.filter((rd) => !rd.is_primary)
				.map((rd) => rd.disease.name);

			if (primaryDiseases.length > 0) {
				parts.push(
					`Ana semptom olduğu hastalıklar: ${primaryDiseases.join(", ")}`,
				);
			}

			if (secondaryDiseases.length > 0) {
				parts.push(
					`İkincil semptom olduğu hastalıklar: ${secondaryDiseases.slice(0, 3).join(", ")}`,
				);
			}

			return parts.filter((p) => p).join(". ");
		} catch (error) {
			logger.error(
				{ error, symptomId: symptom.id },
				"Error building rich symptom context",
			);
			// Fallback
			return symptom.description
				? `${symptom.name}: ${symptom.description}`
				: symptom.name;
		}
	}

	/**
	 * Generate embedding for a single text
	 */
	async generateEmbeddingForText(text: string): Promise<number[]> {
		try {
			logger.info({ textLength: text.length }, "Generating embedding");

			const response = await this.ai.run(
				this.embeddingModel as keyof AiModels,
				{
					text: [text],
				},
			);

			const embedding = (response as { data?: number[][] })?.data?.[0];

			if (!embedding) {
				throw new Error("No embedding returned from AI model");
			}

			logger.info(
				{ dimensions: embedding.length },
				"Embedding generated successfully",
			);

			return embedding;
		} catch (error) {
			logger.error({ error }, "Error generating embedding");
			throw new EmbeddingError(
				"Failed to generate embedding",
				(error as Error).message,
			);
		}
	}

	/**
	 * Generate embeddings for all diseases
	 */
	async generateEmbeddingsForDiseases(): Promise<{
		generated: number;
		failed: number;
	}> {
		try {
			logger.info("Generating embeddings for diseases");

			// Fetch all diseases without embeddings using Prisma
			const diseases = await this.prisma.diseases.findMany({
				where: {
					vector_id: null,
				},
				select: {
					id: true,
					name: true,
					description: true,
				},
			});

			logger.info(
				{ count: diseases.length },
				"Found diseases without embeddings",
			);

			let generated = 0;
			let failed = 0;

			// Process in batches of 10
			const batches = chunk(diseases, 10);

			for (const batch of batches) {
				const results = await Promise.allSettled(
					batch.map(async (disease) => {
						// Build rich contextual text for better embedding
						const text = await this.buildRichDiseaseContext(disease);

						const embedding = await this.generateEmbeddingForText(text);
						const vectorId = `disease-${disease.id}-${Date.now()}`;

						// Store in vector_embeddings table using Prisma
						await this.prisma.vector_embeddings.create({
							data: {
								id: crypto.randomUUID(),
								vector_id: vectorId,
								entity_type: "disease",
								entity_id: disease.id.toString(),
								metadata: JSON.stringify({
									name: disease.name,
									description: disease.description,
								}),
							},
						});

						// Update disease with vectorId using Prisma
						await this.prisma.diseases.update({
							where: { id: disease.id },
							data: { vector_id: vectorId },
						});

						return { disease, vectorId, embedding };
					}),
				);

				for (const result of results) {
					if (result.status === "fulfilled") {
						generated++;
					} else {
						failed++;
						logger.error(
							{ error: result.reason },
							"Failed to generate embedding",
						);
					}
				}
			}

			logger.info(
				{ generated, failed },
				"Disease embeddings generation complete",
			);

			return { generated, failed };
		} catch (error) {
			logger.error({ error }, "Error generating disease embeddings");
			throw new EmbeddingError(
				"Failed to generate disease embeddings",
				(error as Error).message,
			);
		}
	}

	/**
	 * Generate embeddings for all symptoms
	 */
	async generateEmbeddingsForSymptoms(): Promise<{
		generated: number;
		failed: number;
	}> {
		try {
			logger.info("Generating embeddings for symptoms");

			// Fetch all symptoms without embeddings using Prisma
			const symptoms = await this.prisma.symptoms.findMany({
				where: {
					vector_id: null,
				},
				select: {
					id: true,
					name: true,
					description: true,
				},
			});

			logger.info(
				{ count: symptoms.length },
				"Found symptoms without embeddings",
			);

			let generated = 0;
			let failed = 0;

			// Process in batches of 10
			const batches = chunk(symptoms, 10);

			for (const batch of batches) {
				const results = await Promise.allSettled(
					batch.map(async (symptom) => {
						// Build rich contextual text for better embedding
						const text = await this.buildRichSymptomContext(symptom);

						const embedding = await this.generateEmbeddingForText(text);
						const vectorId = `symptom-${symptom.id}-${Date.now()}`;

						// Store in vector_embeddings table using Prisma
						await this.prisma.vector_embeddings.create({
							data: {
								id: crypto.randomUUID(),
								vector_id: vectorId,
								entity_type: "symptom",
								entity_id: symptom.id.toString(),
								metadata: JSON.stringify({
									name: symptom.name,
									description: symptom.description,
								}),
							},
						});

						// Update symptom with vectorId using Prisma
						await this.prisma.symptoms.update({
							where: { id: symptom.id },
							data: { vector_id: vectorId },
						});

						return { symptom, vectorId, embedding };
					}),
				);

				for (const result of results) {
					if (result.status === "fulfilled") {
						generated++;
					} else {
						failed++;
						logger.error(
							{ error: result.reason },
							"Failed to generate embedding",
						);
					}
				}
			}

			logger.info(
				{ generated, failed },
				"Symptom embeddings generation complete",
			);

			return { generated, failed };
		} catch (error) {
			logger.error({ error }, "Error generating symptom embeddings");
			throw new EmbeddingError(
				"Failed to generate symptom embeddings",
				(error as Error).message,
			);
		}
	}

	/**
	 * Generate embeddings for all entities that don't have them
	 */
	async generateAllEmbeddings(): Promise<{
		diseases: { generated: number; failed: number };
		symptoms: { generated: number; failed: number };
	}> {
		logger.info("Starting batch embedding generation");

		const diseases = await this.generateEmbeddingsForDiseases();
		const symptoms = await this.generateEmbeddingsForSymptoms();

		logger.info(
			{
				diseases,
				symptoms,
				total: diseases.generated + symptoms.generated,
			},
			"Batch embedding generation complete",
		);

		return { diseases, symptoms };
	}
}
