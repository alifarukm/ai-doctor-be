import type { D1Database } from "@cloudflare/workers-types";
import type {
	DiagnosisRequest,
	DiagnosisResponse,
	DiagnosisResult,
	SupportiveCareItem,
} from "../types";
import { DiagnosisError } from "../utils/errors";
import { logger } from "../utils/logger";
import { NLPService } from "./nlp.service";
import { SearchService } from "./search.service";
import { DosageService } from "./dosage.service";

export class DiagnosisService {
	constructor(
		private db: D1Database,
		private nlpService: NLPService,
		private searchService: SearchService,
		private dosageService: DosageService,
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
			const extractedSymptoms = await this.nlpService.extractSymptomsFromText(
				request.message,
			);

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

			// Step 9: Build response
			const response: DiagnosisResponse = {
				extractedSymptoms: {
					identified: validatedSymptoms.map((s) => s.symptomName),
					confidence: extractedSymptoms.confidence,
				},
				results,
				recommendations,
				supportiveCare,
				overallConfidence,
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
			const placeholders = diseaseIds.map(() => "?").join(",");

			const result = await this.db
				.prepare(
					`SELECT DISTINCT category, title, description, priority
					 FROM supportive_care
					 WHERE disease_id IN (${placeholders})
					 ORDER BY priority ASC
					 LIMIT 10`,
				)
				.bind(...diseaseIds)
				.all();

			return result.results.map((row) => ({
				category: row.category as string,
				title: row.title as string,
				description: row.description as string,
				priority: row.priority as number,
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
		extractedSymptoms: string[],
		validatedSymptoms: Array<{ symptomId: number; confidence: number }>,
		results: DiagnosisResult[],
		overallConfidence: number,
	): Promise<string> {
		try {
			const queryId = crypto.randomUUID();

			// Store in user_queries table
			await this.db
				.prepare(
					`INSERT INTO user_queries (id, session_id, raw_symptoms, diagnosed_diseases, confidence, created_at)
					 VALUES (?, ?, ?, ?, ?, datetime('now'))`,
				)
				.bind(
					queryId,
					request.sessionId || null,
					request.message,
					JSON.stringify(results),
					overallConfidence,
				)
				.run();

			// Store matched symptoms in query_symptoms table
			for (const symptom of validatedSymptoms) {
				await this.db
					.prepare(
						`INSERT INTO query_symptoms (id, query_id, symptom_id, confidence, createdAt)
						 VALUES (?, ?, ?, ?, datetime('now'))`,
					)
					.bind(
						crypto.randomUUID(),
						queryId,
						symptom.symptomId,
						symptom.confidence,
					)
					.run();
			}

			logger.info({ queryId }, "Diagnosis stored in database");

			return queryId;
		} catch (error) {
			logger.error({ error }, "Error storing diagnosis");
			// Don't throw error - diagnosis was successful even if storage failed
			return crypto.randomUUID();
		}
	}
}
