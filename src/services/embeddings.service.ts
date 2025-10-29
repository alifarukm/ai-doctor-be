import type { D1Database } from "@cloudflare/workers-types";
import type { EntityType, EmbeddingResponse } from "../types";
import { EmbeddingError } from "../utils/errors";
import { logger } from "../utils/logger";
import { chunk } from "../utils/helpers";

export class EmbeddingsService {
	constructor(
		private ai: Ai,
		private db: D1Database,
		private embeddingModel: string,
	) {}

	/**
	 * Generate embedding for a single text
	 */
	async generateEmbeddingForText(text: string): Promise<number[]> {
		try {
			logger.info({ textLength: text.length }, "Generating embedding");

			const response = await this.ai.run(this.embeddingModel, {
				text: [text],
			});

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

			// Fetch all diseases
			const diseasesResult = await this.db
				.prepare(
					"SELECT id, name, description FROM diseases WHERE vectorId IS NULL",
				)
				.all();

			const diseases = diseasesResult.results as Array<{
				id: number;
				name: string;
				description: string | null;
			}>;

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
						// Combine name and description for better embedding
						const text = disease.description
							? `${disease.name}: ${disease.description}`
							: disease.name;

						const embedding = await this.generateEmbeddingForText(text);
						const vectorId = `disease-${disease.id}-${Date.now()}`;

						// Store in vector_embeddings table
						await this.db
							.prepare(
								`INSERT INTO vector_embeddings (id, vector_id, entity_type, entity_id, metadata, created_at, updated_at)
								 VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
							)
							.bind(
								crypto.randomUUID(),
								vectorId,
								"disease",
								disease.id.toString(),
								JSON.stringify({
									name: disease.name,
									description: disease.description,
								}),
							)
							.run();

						// Update disease with vectorId
						await this.db
							.prepare("UPDATE diseases SET vectorId = ? WHERE id = ?")
							.bind(vectorId, disease.id)
							.run();

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

			// Fetch all symptoms without embeddings
			const symptomsResult = await this.db
				.prepare(
					"SELECT id, name, description FROM symptoms WHERE vectorId IS NULL",
				)
				.all();

			const symptoms = symptomsResult.results as Array<{
				id: number;
				name: string;
				description: string | null;
			}>;

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
						// Combine name and description for better embedding
						const text = symptom.description
							? `${symptom.name}: ${symptom.description}`
							: symptom.name;

						const embedding = await this.generateEmbeddingForText(text);
						const vectorId = `symptom-${symptom.id}-${Date.now()}`;

						// Store in vector_embeddings table
						await this.db
							.prepare(
								`INSERT INTO vector_embeddings (id, vector_id, entity_type, entity_id, metadata, created_at, updated_at)
								 VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
							)
							.bind(
								crypto.randomUUID(),
								vectorId,
								"symptom",
								symptom.id.toString(),
								JSON.stringify({
									name: symptom.name,
									description: symptom.description,
								}),
							)
							.run();

						// Update symptom with vectorId
						await this.db
							.prepare("UPDATE symptoms SET vectorId = ? WHERE id = ?")
							.bind(vectorId, symptom.id)
							.run();

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
