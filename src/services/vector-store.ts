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

			// Remove array fields that Vectorize doesn't support
			const { relatedEntityIds, ...cleanMetadata } = metadata;

			const vector: VectorizeVector = {
				id: vectorId,
				values: embedding,
				metadata: cleanMetadata as Record<string, string | number | boolean>,
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
	async deleteVectors(vectorIds: string[]): Promise<void> {
		try {
			logger.info({ vectorIds }, "Deleting vectors");

			await this.vectorize.deleteByIds(vectorIds);

			logger.info({ vectorIds }, "Vectors deleted successfully");
		} catch (error) {
			logger.error({ error, vectorIds }, "Error deleting vectors");
			throw new VectorizeError("Failed to delete vectors", error as Error);
		}
	}

	async clearAllVectors(): Promise<void> {
		try {
			logger.info("Clearing all vector embeddings from Vectorize");

			// Get all vector IDs from database instead of querying empty vector
			const allEmbeddings = await this.prisma.vector_embeddings.findMany({
				select: {
					vector_id: true,
				},
			});

			const vectorIds = allEmbeddings.map((emb) => emb.vector_id);

			if (vectorIds.length === 0) {
				logger.info("No vectors found to delete");
				return;
			}

			logger.info(
				{ count: vectorIds.length },
				"Deleting vectors from Vectorize",
			);

			await this.deleteVectors(vectorIds);

			logger.info(
				{ deletedCount: vectorIds.length },
				"All vector embeddings cleared",
			);
		} catch (error) {
			logger.error(
				{ error },
				"Error clearing all vector embeddings from Vectorize",
			);
			throw new VectorizeError(
				"Failed to clear all vector embeddings from Vectorize",
				error as Error,
			);
		}
	}

	async clearAllVectorEmbeddings(): Promise<void> {
		try {
			await this.prisma.vector_embeddings.deleteMany({});
		} catch (error) {
			logger.error(
				{ error },
				"Error clearing all vector embeddings from database",
			);
			throw new VectorizeError(
				"Failed to clear all vector embeddings from database",
				error as Error,
			);
		}
	}
}
