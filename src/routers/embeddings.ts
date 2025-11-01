import { Hono } from "hono";
import prismaClients from "@/libs/prisma/index";
import {
	DiseasesService,
	EmbeddingsService,
	SymptomsService,
	VectorStoreService,
} from "@/services";
import type { CloudflareBindings } from "@/types";
import { logger } from "@/utils/logger";

export const embeddingsRouter = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * POST /generate - Generate embeddings for all entities
 */
embeddingsRouter.post("/generate", async (c) => {
	try {
		const env = c.env;

		logger.info("Batch embedding generation requested");

		// Initialize Prisma client
		const prisma = await prismaClients.fetch(env.DB);

		// Initialize services with Prisma
		const embeddingsService = new EmbeddingsService(
			env.AI,
			prisma,
			env.EMBEDDING_MODEL,
		);
		const vectorStoreService = new VectorStoreService(env.VECTORIZE, prisma);

		// Generate embeddings for all entities
		const result = await embeddingsService.generateAllEmbeddings();

		// Now upsert to Vectorize
		logger.info("Upserting embeddings to Vectorize");

		// Get all vector embeddings from database using Prisma
		const embeddingsResult = await prisma.vector_embeddings.findMany({
			select: {
				vector_id: true,
				entity_type: true,
				entity_id: true,
				metadata: true,
			},
		});

		// For each embedding, generate and upsert to Vectorize
		let upserted = 0;
		let failed = 0;

		for (const row of embeddingsResult) {
			try {
				const metadata = JSON.parse(row.metadata as string);
				const text = metadata.description
					? `${metadata.name}: ${metadata.description}`
					: metadata.name;

				const embedding =
					await embeddingsService.generateEmbeddingForText(text);

				await vectorStoreService.upsertVector(
					row.vector_id as string,
					embedding,
					{
						entityType: row.entity_type as
							| "disease"
							| "symptom"
							| "treatment"
							| "query",
						entityId: row.entity_id as string,
						name: metadata.name,
						description: metadata.description,
						createdAt: new Date().toISOString(),
					},
				);

				upserted++;
			} catch (error) {
				logger.error(
					{ error, vectorId: row.vector_id },
					"Failed to upsert vector",
				);
				failed++;
			}
		}

		return c.json(
			{
				success: true,
				data: {
					generated: {
						diseases: result.diseases,
						symptoms: result.symptoms,
					},
					vectorize: {
						upserted,
						failed,
					},
				},
				timestamp: new Date().toISOString(),
			},
			200,
		);
	} catch (error) {
		logger.error({ error }, "Error generating embeddings");

		return c.json(
			{
				success: false,
				error: {
					code: "EMBEDDING_GENERATION_ERROR",
					message: (error as Error).message || "Failed to generate embeddings",
				},
				timestamp: new Date().toISOString(),
			},
			500,
		);
	}
});

embeddingsRouter.post("/clear", async (c) => {
	try {
		const env = c.env;

		logger.info("Batch embedding generation requested");

		// Initialize Prisma client
		const prisma = await prismaClients.fetch(env.DB);

		const symptomsService = new SymptomsService(prisma);
		const diseasesService = new DiseasesService(prisma);
		const vectorStoreService = new VectorStoreService(env.VECTORIZE, prisma);

		await vectorStoreService.clearAllVectors();

		await Promise.all([
			symptomsService.clearVectorsFromSymptoms(),
			diseasesService.clearVectorsFromDiseases(),
			vectorStoreService.clearAllVectorEmbeddings(),
		]);

		return c.json(
			{
				success: true,
				data: {},
				timestamp: new Date().toISOString(),
			},
			200,
		);
	} catch (error) {
		logger.error({ error }, "Error generating embeddings");

		return c.json(
			{
				success: false,
				error: {
					code: "EMBEDDING_CLEAR_ERROR",
					message: (error as Error).message || "Failed to generate embeddings",
				},
				timestamp: new Date().toISOString(),
			},
			500,
		);
	}
});
