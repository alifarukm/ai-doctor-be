import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import prismaClients from "../../lib/prisma/index";
import {
	DiagnosisService,
	DosageService,
	EmbeddingsService,
	GraphService,
	LLMService,
	NLPService,
	SearchService,
	VectorStoreService,
} from "../services";
import type { CloudflareBindings } from "../types";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export const diagnosisRouter = new Hono<{ Bindings: CloudflareBindings }>();

const PatientInfoSchema = z.object({
	age: z.number().int().min(0).max(150),
	weight: z.number().positive().max(300),
	type: z.enum(["pediatric", "adult"]),
	allergies: z.array(z.string()).optional(),
});

const DiagnosisRequestSchema = z.object({
	message: z.string().min(10).max(1000),
	patientInfo: PatientInfoSchema,
	sessionId: z.string().uuid().optional(),
});

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

			// Initialize Prisma client
			const prisma = await prismaClients.fetch(env.DB);

			// Initialize services with Prisma
			const nlpService = new NLPService(env.AI, prisma, env.NLP_MODEL);
			const embeddingsService = new EmbeddingsService(
				env.AI,
				prisma,
				env.EMBEDDING_MODEL,
			);
			const vectorStoreService = new VectorStoreService(env.VECTORIZE, prisma);
			const graphService = new GraphService(prisma);
			const searchService = new SearchService(
				embeddingsService,
				vectorStoreService,
				graphService,
			);
			const dosageService = new DosageService(prisma);

			// Initialize LLM service if configured
			let llmService: LLMService | undefined;
			if (env.LLM_PROVIDER && env.LLM_API_KEY) {
				llmService = new LLMService(
					{
						provider: env.LLM_PROVIDER as
							| "openai"
							| "gemini"
							| "anthropic"
							| "cloudflare",
						apiKey: env.LLM_API_KEY,
						model: env.LLM_MODEL,
						temperature: env.LLM_TEMPERATURE
							? Number.parseFloat(env.LLM_TEMPERATURE)
							: undefined,
						maxTokens: env.LLM_MAX_TOKENS
							? Number.parseInt(env.LLM_MAX_TOKENS, 10)
							: undefined,
					},
					prisma,
				);
			}

			const diagnosisService = new DiagnosisService(
				prisma,
				nlpService,
				searchService,
				dosageService,
				llmService, // Optional LLM enhancement
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
