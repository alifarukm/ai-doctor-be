import type { MatchedSymptom, DiseaseCandidate } from "../types";
import { logger } from "../utils/logger";
import { EmbeddingsService } from "./embeddings.service";
import { VectorstoreService } from "./vectorstore.service";
import { GraphService } from "./graph.service";

export class SearchService {
	constructor(
		private embeddingsService: EmbeddingsService,
		private vectorstoreService: VectorstoreService,
		private graphService: GraphService,
	) {}

	/**
	 * Hybrid search: combine vector similarity with graph traversal
	 */
	async hybridSearch(
		validatedSymptoms: MatchedSymptom[],
		limit = 10,
	): Promise<DiseaseCandidate[]> {
		try {
			logger.info(
				{ symptomCount: validatedSymptoms.length, limit },
				"Starting hybrid search",
			);

			// Phase 1: Vector Search
			// Create query text from validated symptoms
			const queryText = validatedSymptoms.map((s) => s.symptomName).join(" ");

			logger.info({ queryText }, "Generating embedding for query");

			// Generate embedding for the query
			const queryEmbedding =
				await this.embeddingsService.generateEmbeddingForText(queryText);

			// Search for similar diseases and symptoms in vector store
			const vectorResults = await this.vectorstoreService.searchVectors(
				queryEmbedding,
				Math.min(limit * 3, 30), // Get more candidates for graph filtering
				0.4, // Lower threshold to get more candidates
			);

			logger.info({ found: vectorResults.length }, "Vector search complete");

			// Extract unique disease IDs from vector results
			const diseaseIds = [
				...new Set(
					vectorResults
						.filter((r) => r.metadata.entityType === "disease")
						.map((r) => Number(r.metadata.entityId)),
				),
			];

			// Also get diseases related to matched symptoms
			const symptomIds = validatedSymptoms.map((s) => s.symptomId);
			const relatedDiseaseIds = await this.getDiseasesFromSymptoms(symptomIds);

			// Combine and deduplicate disease IDs
			const allDiseaseIds = [...new Set([...diseaseIds, ...relatedDiseaseIds])];

			logger.info(
				{ diseases: allDiseaseIds.length },
				"Identified disease candidates",
			);

			// Phase 2: Graph Traversal and Scoring
			const diseaseGraphs =
				await this.graphService.traverseDiseaseGraph(allDiseaseIds);

			const candidates: DiseaseCandidate[] = [];

			for (const graphNode of diseaseGraphs) {
				// Calculate symptom matches
				const symptomMatches = this.graphService.calculateSymptomRelevance(
					validatedSymptoms,
					graphNode,
				);

				// Calculate graph score based on symptom matching
				const graphScore = this.graphService.scoreDiseaseLikelihood(
					symptomMatches,
					graphNode,
				);

				// Get vector score if available
				const vectorResult = vectorResults.find(
					(r) =>
						r.metadata.entityType === "disease" &&
						Number(r.metadata.entityId) === graphNode.diseaseId,
				);

				const vectorScore = vectorResult?.score || 0;

				// Combined score: 30% vector, 70% graph
				const combinedScore = this.scoreSearchResults(vectorScore, graphScore);

				candidates.push({
					diseaseId: graphNode.diseaseId,
					vectorScore,
					graphScore,
					combinedScore,
					graphNode,
				});
			}

			// Sort by combined score
			candidates.sort((a, b) => b.combinedScore - a.combinedScore);

			// Return top candidates
			const topCandidates = candidates.slice(0, limit);

			logger.info(
				{ candidates: topCandidates.length },
				"Hybrid search complete",
			);

			return topCandidates;
		} catch (error) {
			logger.error({ error }, "Error in hybrid search");
			throw error;
		}
	}

	/**
	 * Get disease IDs that have specific symptoms
	 */
	private async getDiseasesFromSymptoms(
		symptomIds: number[],
	): Promise<number[]> {
		try {
			if (symptomIds.length === 0) {
				return [];
			}

			const graphService = this.graphService as GraphService & {
				db: import("@cloudflare/workers-types").D1Database;
			};

			const placeholders = symptomIds.map(() => "?").join(",");
			const result = await graphService.db
				.prepare(
					`SELECT DISTINCT disease_id FROM disease_symptoms WHERE symptom_id IN (${placeholders})`,
				)
				.bind(...symptomIds)
				.all();

			return result.results.map((r) => r.disease_id as number);
		} catch (error) {
			logger.error({ error }, "Error getting diseases from symptoms");
			return [];
		}
	}

	/**
	 * Calculate combined score from vector and graph scores
	 */
	private scoreSearchResults(
		vectorScore: number,
		graphScore: number,
		weights = { vector: 0.3, graph: 0.7 },
	): number {
		const combined = vectorScore * weights.vector + graphScore * weights.graph;
		return Math.min(combined, 1.0);
	}
}
