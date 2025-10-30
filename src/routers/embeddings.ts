import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import prismaClients from "@/libs/prisma/index";
import { EmbeddingsService, VectorStoreService } from "@/services";
import type { CloudflareBindings } from "@/types";
import { logger } from "@/utils/logger";

export const embeddingsRouter = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * Batch embedding generation schema
 */
const BatchEmbeddingRequestSchema = z.object({
	entityType: z.enum(["disease", "symptom", "treatment"]),
	entityIds: z.array(z.number()).optional(),
});

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
						entityId: row.entity_id as number,
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

/**
 * POST /generate-batch - Generate embeddings for specific entities
 */
embeddingsRouter.post(
	"/generate-batch",
	zValidator("json", BatchEmbeddingRequestSchema),
	async (c) => {
		try {
			const request = c.req.valid("json");
			const env = c.env;

			logger.info(
				{ entityType: request.entityType },
				"Batch generation for entity type",
			);

			// Initialize Prisma client
			const prisma = await prismaClients.fetch(env.DB);

			const embeddingsService = new EmbeddingsService(
				env.AI,
				prisma,
				env.EMBEDDING_MODEL,
			);

			let result: { generated: number; failed: number };

			if (request.entityType === "disease") {
				result = await embeddingsService.generateEmbeddingsForDiseases();
			} else if (request.entityType === "symptom") {
				result = await embeddingsService.generateEmbeddingsForSymptoms();
			} else {
				return c.json(
					{
						success: false,
						error: {
							code: "INVALID_ENTITY_TYPE",
							message: "Only disease and symptom entity types are supported",
						},
					},
					400,
				);
			}

			return c.json(
				{
					success: true,
					data: result,
					timestamp: new Date().toISOString(),
				},
				200,
			);
		} catch (error) {
			logger.error({ error }, "Error in batch generation");

			return c.json(
				{
					success: false,
					error: {
						code: "BATCH_GENERATION_ERROR",
						message:
							(error as Error).message || "Failed to generate batch embeddings",
					},
					timestamp: new Date().toISOString(),
				},
				500,
			);
		}
	},
);
