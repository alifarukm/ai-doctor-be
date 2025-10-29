import type { Vectorize, VectorizeVector } from "@cloudflare/workers-types";
import type { D1Database } from "@cloudflare/workers-types";
import type { VectorMetadata, VectorSearchResult } from "../types";
import { VectorizeError } from "../utils/errors";
import { logger } from "../utils/logger";

export class VectorstoreService {
	constructor(
		private vectorize: Vectorize,
		private db: D1Database,
	) {}

	/**
	 * Insert or update a vector in Vectorize
	 */
	async upsertVector(
		vectorId: string,
		embedding: number[],
		metadata: VectorMetadata,
	): Promise<void> {
		try {
			logger.info(
				{ vectorId, dimensions: embedding.length },
				"Upserting vector",
			);

			const vector: VectorizeVector = {
				id: vectorId,
				values: embedding,
				metadata: metadata as Record<string, string | number | boolean>,
			};

			await this.vectorize.upsert([vector]);

			logger.info({ vectorId }, "Vector upserted successfully");
		} catch (error) {
			logger.error({ error, vectorId }, "Error upserting vector");
			throw new VectorizeError("Failed to upsert vector", error as Error);
		}
	}

	/**
	 * Search for similar vectors
	 */
	async searchVectors(
		embedding: number[],
		limit = 10,
		threshold = 0.5,
	): Promise<VectorSearchResult[]> {
		try {
			logger.info(
				{ dimensions: embedding.length, limit, threshold },
				"Searching vectors",
			);

			const results = await this.vectorize.query(embedding, {
				topK: limit,
				returnValues: false,
				returnMetadata: "all",
			});

			const filtered = results.matches
				.filter((match) => match.score >= threshold)
				.map((match) => ({
					id: match.id,
					score: match.score,
					metadata: match.metadata as unknown as VectorMetadata,
				}));

			logger.info({ found: filtered.length }, "Vector search complete");

			return filtered;
		} catch (error) {
			logger.error({ error }, "Error searching vectors");
			throw new VectorizeError("Failed to search vectors", error as Error);
		}
	}

	/**
	 * Delete a vector from Vectorize
	 */
	async deleteVector(vectorId: string): Promise<void> {
		try {
			logger.info({ vectorId }, "Deleting vector");

			await this.vectorize.deleteByIds([vectorId]);

			logger.info({ vectorId }, "Vector deleted successfully");
		} catch (error) {
			logger.error({ error, vectorId }, "Error deleting vector");
			throw new VectorizeError("Failed to delete vector", error as Error);
		}
	}

	/**
	 * Get vector metadata from database
	 */
	async getVectorMetadata(vectorId: string): Promise<VectorMetadata | null> {
		try {
			const result = await this.db
				.prepare(
					"SELECT entity_type, entity_id, metadata FROM vector_embeddings WHERE vector_id = ?",
				)
				.bind(vectorId)
				.first();

			if (!result) {
				return null;
			}

			const metadata = JSON.parse(result.metadata as string);

			return {
				entityType: result.entity_type as VectorMetadata["entityType"],
				entityId: result.entity_id as number,
				name: metadata.name,
				description: metadata.description,
				createdAt: new Date().toISOString(),
			};
		} catch (error) {
			logger.error({ error, vectorId }, "Error getting vector metadata");
			throw new VectorizeError("Failed to get vector metadata", error as Error);
		}
	}

	/**
	 * Batch upsert vectors
	 */
	async batchUpsertVectors(
		vectors: Array<{
			vectorId: string;
			embedding: number[];
			metadata: VectorMetadata;
		}>,
	): Promise<{ success: number; failed: number }> {
		try {
			logger.info({ count: vectors.length }, "Batch upserting vectors");

			const vectorizeVectors: VectorizeVector[] = vectors.map((v) => ({
				id: v.vectorId,
				values: v.embedding,
				metadata: v.metadata as Record<string, string | number | boolean>,
			}));

			await this.vectorize.upsert(vectorizeVectors);

			logger.info(
				{ success: vectors.length },
				"Batch upsert completed successfully",
			);

			return { success: vectors.length, failed: 0 };
		} catch (error) {
			logger.error({ error }, "Error batch upserting vectors");
			throw new VectorizeError(
				"Failed to batch upsert vectors",
				error as Error,
			);
		}
	}
}
