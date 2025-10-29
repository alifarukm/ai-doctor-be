import type { PrismaClient } from "@/libs/prisma-client";
import type {
	DiagnosisRequest,
	DiagnosisResponse,
	DiagnosisResult,
	SupportiveCareItem,
} from "@/types";
import { DiagnosisError, logger } from "@/utils";
import type { DosageService } from "./dosage";
import type { LLMService } from "./llm";
import type { NLPService } from "./nlp";
import type { SearchService } from "./search";

export class DiagnosisService {
	constructor(
		private prisma: PrismaClient,
		private nlpService: NLPService,
		private searchService: SearchService,
		private dosageService: DosageService,
		private llmService?: LLMService, // Optional for enhanced reasoning
	) {}

	/**
	 * Main diagnosis processing method
	 */
	async processDiagnosis(
		request: DiagnosisRequest,
	): Promise<DiagnosisResponse> {
		try {
			logger.info({ message: request.message }, "Processing diagnosis");

			// Step 1: Extract symptoms from natural language
			// Use LLM if available, fallback to basic NLP
			const extractedSymptoms = this.llmService
				? await this.llmService.extractSymptoms(request.message)
				: await this.nlpService.extractSymptomsFromText(request.message);

			logger.info(
				{ symptoms: extractedSymptoms.extractedSymptoms },
				"Symptoms extracted",
			);

			// Step 2: Validate and match symptoms to database
			const validatedSymptoms = await this.nlpService.validateAndMatchSymptoms(
				extractedSymptoms.extractedSymptoms,
			);

			if (validatedSymptoms.length === 0) {
				throw new DiagnosisError(
					"No valid symptoms identified from your message",
				);
			}

			logger.info(
				{ validated: validatedSymptoms.length },
				"Symptoms validated",
			);

			// Step 3: Hybrid search (vector + graph)
			const diseaseCandidates = await this.searchService.hybridSearch(
				validatedSymptoms,
				10,
			);

			logger.info(
				{ candidates: diseaseCandidates.length },
				"Disease candidates identified",
			);

			// Step 4: Create diagnosis results
			const results: DiagnosisResult[] = diseaseCandidates
				.filter((c) => c.combinedScore > 0.1) // Filter out very low scores
				.slice(0, 5) // Top 5 results
				.map((candidate) => ({
					diseaseId: candidate.diseaseId,
					diseaseName: candidate.graphNode.diseaseName,
					description: candidate.graphNode.description,
					category: candidate.graphNode.category,
					confidence: candidate.combinedScore,
					matchedSymptoms: validatedSymptoms.filter((vs) =>
						candidate.graphNode.symptoms.some((s) => s.id === vs.symptomId),
					),
					diagnosticCriteria: candidate.graphNode.diagnosticCriteria.map(
						(dc) => dc.criteria,
					),
					vectorScore: candidate.vectorScore,
					graphScore: candidate.graphScore,
				}));

			if (results.length === 0) {
				throw new DiagnosisError(
					"Unable to identify any matching conditions based on the symptoms provided",
				);
			}

			// Step 5: Get medication recommendations for top diagnoses
			const allRecommendations = await Promise.all(
				results
					.slice(0, 3)
					.map((result) =>
						this.dosageService.getMedicationRecommendations(
							result.diseaseId,
							request.patientInfo,
						),
					),
			);

			// Flatten and deduplicate recommendations
			const recommendationsMap = new Map();
			for (const recommendations of allRecommendations) {
				for (const rec of recommendations) {
					if (!recommendationsMap.has(rec.medicationId)) {
						recommendationsMap.set(rec.medicationId, rec);
					}
				}
			}

			const recommendations = Array.from(recommendationsMap.values());

			// Step 6: Get supportive care recommendations
			const supportiveCare = await this.getSupportiveCare(
				results.map((r) => r.diseaseId),
			);

			// Step 7: Calculate overall confidence
			const overallConfidence =
				results.length > 0
					? results.slice(0, 3).reduce((sum, r) => sum + r.confidence, 0) /
						Math.min(results.length, 3)
					: 0;

			// Step 8: Store diagnosis in database
			const queryId = await this.storeDiagnosis(
				request,
				extractedSymptoms.extractedSymptoms,
				validatedSymptoms,
				results,
				overallConfidence,
			);

			// Step 9: Generate LLM explanation and follow-up questions (if available)
			let explanation: string | undefined;
			let followUpQuestions: string[] | undefined;

			if (this.llmService) {
				try {
					[explanation, followUpQuestions] = await Promise.all([
						this.llmService.generateDiagnosisExplanation(
							validatedSymptoms.map((s) => s.symptomName),
							results,
							request.patientInfo,
						),
						this.llmService.suggestFollowUpQuestions(
							validatedSymptoms.map((s) => s.symptomName),
							results,
						),
					]);
				} catch (error) {
					logger.warn({ error }, "Failed to generate LLM explanation");
					// Continue without LLM enhancement
				}
			}

			// Step 10: Build response
			const response: DiagnosisResponse = {
				extractedSymptoms: {
					identified: validatedSymptoms.map((s) => s.symptomName),
					confidence: extractedSymptoms.confidence,
				},
				results,
				recommendations,
				supportiveCare,
				overallConfidence,
				explanation,
				followUpQuestions,
				sessionId: request.sessionId || queryId,
				timestamp: new Date().toISOString(),
			};

			logger.info({ queryId, results: results.length }, "Diagnosis complete");

			return response;
		} catch (error) {
			logger.error({ error }, "Error processing diagnosis");
			throw error;
		}
	}

	/**
	 * Get supportive care recommendations for diseases
	 */
	private async getSupportiveCare(
		diseaseIds: number[],
	): Promise<SupportiveCareItem[]> {
		try {
			// Use Prisma to get supportive care
			const supportiveCare = await this.prisma.supportive_care.findMany({
				where: {
					disease_id: {
						in: diseaseIds,
					},
				},
				orderBy: {
					priority: "asc",
				},
				take: 10,
				distinct: ["category", "title"],
			});

			return supportiveCare.map((sc) => ({
				category: sc.category,
				title: sc.title,
				description: sc.description,
				priority: sc.priority,
			}));
		} catch (error) {
			logger.error({ error }, "Error getting supportive care");
			return [];
		}
	}

	/**
	 * Store diagnosis in database
	 */
	private async storeDiagnosis(
		request: DiagnosisRequest,
		_extractedSymptoms: string[],
		validatedSymptoms: Array<{ symptomId: number; confidence: number }>,
		results: DiagnosisResult[],
		overallConfidence: number,
	): Promise<string> {
		try {
			const queryId = crypto.randomUUID();

			// Store in user_queries table using Prisma
			await this.prisma.user_queries.create({
				data: {
					id: queryId,
					session_id: request.sessionId || null,
					raw_symptoms: request.message,
					diagnosed_diseases: results as any, // JSON type
					confidence: overallConfidence,
				},
			});

			// Store matched symptoms in query_symptoms table using Prisma
			await this.prisma.query_symptoms.createMany({
				data: validatedSymptoms.map((symptom) => ({
					id: crypto.randomUUID(),
					query_id: queryId,
					symptom_id: symptom.symptomId,
					confidence: symptom.confidence,
				})),
			});

			logger.info({ queryId }, "Diagnosis stored in database");

			return queryId;
		} catch (error) {
			logger.error({ error }, "Error storing diagnosis");
			// Don't throw error - diagnosis was successful even if storage failed
			return crypto.randomUUID();
		}
	}
}
