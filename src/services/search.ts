import type { DiseaseCandidate, MatchedSymptom } from "@/types";
import { logger } from "@/utils/logger";
import type { EmbeddingsService } from "./embeddings";
import type { GraphService } from "./graph";
import type { VectorStoreService } from "./vector-store";

export class SearchService {
	constructor(
		private embeddingsService: EmbeddingsService,
		private vectorStoreService: VectorStoreService,
		private graphService: GraphService,
	) {}

	/**
	 * Calculate dynamic threshold based on symptom count
	 * Fewer symptoms = higher threshold (more selective)
	 * More symptoms = lower threshold (more inclusive)
	 */
	private calculateDynamicThreshold(symptomCount: number): number {
		if (symptomCount <= 1) return 0.65;
		if (symptomCount <= 2) return 0.6;
		if (symptomCount <= 3) return 0.55;
		return 0.5;
	}

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

			// Calculate dynamic threshold based on symptom count
			const threshold = this.calculateDynamicThreshold(
				validatedSymptoms.length,
			);

			logger.info(
				{ threshold, symptomCount: validatedSymptoms.length },
				"Using dynamic threshold",
			);

			// Search for similar diseases and symptoms in vector store
			const vectorResults = await this.vectorStoreService.searchVectors(
				queryEmbedding,
				Math.min(limit * 3, 30), // Get more candidates for graph filtering
				threshold, // Dynamic threshold based on symptom count
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

				// Evaluate negative diagnostic criteria
				const negativePenalty =
					await this.graphService.evaluateNegativeCriteria(
						graphNode.diseaseId,
						validatedSymptoms,
					);

				// Get vector score if available
				const vectorResult = vectorResults.find(
					(r) =>
						r.metadata.entityType === "disease" &&
						Number(r.metadata.entityId) === graphNode.diseaseId,
				);

				const vectorScore = vectorResult?.score || 0;

				// Combined score: 30% vector, 70% graph, minus negative criteria penalty
				const rawCombinedScore = this.scoreSearchResults(
					vectorScore,
					graphScore,
				);
				const combinedScore = Math.max(rawCombinedScore - negativePenalty, 0);

				candidates.push({
					diseaseId: graphNode.diseaseId,
					vectorScore,
					graphScore,
					combinedScore,
					graphNode,
					negativePenalty, // For debugging/transparency
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
	 * Get disease IDs that have specific symptoms using Prisma through graphService
	 */
	private async getDiseasesFromSymptoms(
		symptomIds: number[],
	): Promise<number[]> {
		try {
			if (symptomIds.length === 0) {
				return [];
			}

			// Use Prisma through graphService
			const diseaseSymptoms =
				await this.graphService.prisma.disease_symptoms.findMany({
					where: {
						symptom_id: {
							in: symptomIds,
						},
					},
					select: {
						disease_id: true,
					},
					distinct: ["disease_id"],
				});

			return diseaseSymptoms.map((ds) => ds.disease_id);
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
