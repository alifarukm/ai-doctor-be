import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { CloudflareBindings } from "../types";
import { BatchEmbeddingRequestSchema } from "../utils/validators";
import { logger } from "../utils/logger";
import { EmbeddingsService, VectorstoreService } from "../services";

export const embeddingsRouter = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * POST /generate - Generate embeddings for all entities
 */
embeddingsRouter.post("/generate", async (c) => {
	try {
		const env = c.env;

		logger.info("Batch embedding generation requested");

		// Initialize services
		const embeddingsService = new EmbeddingsService(
			env.AI,
			env.DB,
			env.EMBEDDING_MODEL,
		);
		const vectorstoreService = new VectorstoreService(env.VECTORIZE, env.DB);

		// Generate embeddings for all entities
		const result = await embeddingsService.generateAllEmbeddings();

		// Now upsert to Vectorize
		logger.info("Upserting embeddings to Vectorize");

		// Get all vector embeddings from database
		const embeddingsResult = await env.DB.prepare(
			"SELECT vector_id, entity_type, entity_id, metadata FROM vector_embeddings",
		).all();

		// For each embedding, generate and upsert to Vectorize
		let upserted = 0;
		let failed = 0;

		for (const row of embeddingsResult.results) {
			try {
				const metadata = JSON.parse(row.metadata as string);
				const text = metadata.description
					? `${metadata.name}: ${metadata.description}`
					: metadata.name;

				const embedding =
					await embeddingsService.generateEmbeddingForText(text);

				await vectorstoreService.upsertVector(
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

			const embeddingsService = new EmbeddingsService(
				env.AI,
				env.DB,
				env.EMBEDDING_MODEL,
			);

			let result;

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
