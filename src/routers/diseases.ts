import { Hono } from "hono";
import prismaClients from "@/libs/prisma/index";
import { DiseasesService } from "@/services";
import type { CloudflareBindings } from "@/types";
import { logger, ValidationError } from "@/utils";

export const diseasesRouter = new Hono<{ Bindings: CloudflareBindings }>();

diseasesRouter.get("/", async (c) => {
	try {
		const env = c.env;

		// Initialize Prisma client
		const prisma = await prismaClients.fetch(env.DB);

		const diseasesService = new DiseasesService(prisma);

		const diseases = await diseasesService.getAllDiseases();
		return c.json(
			{
				success: true,
				data: diseases,
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
});
