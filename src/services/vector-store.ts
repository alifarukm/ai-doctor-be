import type { Vectorize, VectorizeVector } from "@cloudflare/workers-types";
import type { PrismaClient } from "@/libs/prisma-client";
import type { VectorMetadata, VectorSearchResult } from "@/types";
import { logger, VectorizeError } from "@/utils";

export class VectorStoreService {
	constructor(
		private vectorize: Vectorize,
		private prisma: PrismaClient,
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
	 * Get vector metadata from database using Prisma
	 */
	async getVectorMetadata(vectorId: string): Promise<VectorMetadata | null> {
		try {
			const embedding = await this.prisma.vector_embeddings.findUnique({
				where: {
					vector_id: vectorId,
				},
				select: {
					entity_type: true,
					entity_id: true,
					metadata: true,
					created_at: true,
				},
			});

			if (!embedding) {
				return null;
			}

			const metadata =
				typeof embedding.metadata === "string"
					? JSON.parse(embedding.metadata)
					: embedding.metadata;

			return {
				entityType: embedding.entity_type as VectorMetadata["entityType"],
				entityId: Number(embedding.entity_id),
				name: metadata.name,
				description: metadata.description,
				createdAt: embedding.created_at.toISOString(),
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
