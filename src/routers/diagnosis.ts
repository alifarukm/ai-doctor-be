import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { CloudflareBindings } from "../types";
import { DiagnosisRequestSchema } from "../utils/validators";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";
import {
	DiagnosisService,
	NLPService,
	EmbeddingsService,
	VectorstoreService,
	GraphService,
	SearchService,
	DosageService,
} from "../services";

export const diagnosisRouter = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * POST /diagnose - Main diagnosis endpoint
 */
diagnosisRouter.post(
	"/diagnose",
	zValidator("json", DiagnosisRequestSchema),
	async (c) => {
		try {
			const request = c.req.valid("json");
			const env = c.env;

			logger.info({ message: request.message }, "Diagnosis request received");

			// Initialize services
			const nlpService = new NLPService(env.AI, env.DB, env.NLP_MODEL);
			const embeddingsService = new EmbeddingsService(
				env.AI,
				env.DB,
				env.EMBEDDING_MODEL,
			);
			const vectorstoreService = new VectorstoreService(env.VECTORIZE, env.DB);
			const graphService = new GraphService(env.DB);
			const searchService = new SearchService(
				embeddingsService,
				vectorstoreService,
				graphService,
			);
			const dosageService = new DosageService(env.DB);
			const diagnosisService = new DiagnosisService(
				env.DB,
				nlpService,
				searchService,
				dosageService,
			);

			// Process diagnosis
			const result = await diagnosisService.processDiagnosis(request);

			return c.json(
				{
					success: true,
					data: result,
					timestamp: new Date().toISOString(),
				},
				200,
			);
		} catch (error) {
			logger.error({ error }, "Error processing diagnosis request");

			if (error instanceof ValidationError) {
				return c.json(
					{
						success: false,
						error: {
							code: error.code,
							message: error.message,
							details: error.details,
						},
						timestamp: new Date().toISOString(),
					},
					error.statusCode,
				);
			}

			return c.json(
				{
					success: false,
					error: {
						code: "INTERNAL_ERROR",
						message: (error as Error).message || "An unexpected error occurred",
					},
					timestamp: new Date().toISOString(),
				},
				500,
			);
		}
	},
);
