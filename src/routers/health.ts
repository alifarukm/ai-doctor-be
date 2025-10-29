import { Hono } from "hono";
import type { CloudflareBindings } from "../types";
import { logger } from "../utils/logger";

export const healthRouter = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * GET / - Health check endpoint
 */
healthRouter.get("/", async (c) => {
	try {
		const env = c.env;
		const checks: Record<string, boolean> = {};

		// Check database connectivity
		try {
			await env.DB.prepare("SELECT 1").first();
			checks.database = true;
		} catch {
			checks.database = false;
		}

		// Check if Vectorize is available
		try {
			checks.vectorize = !!env.VECTORIZE;
		} catch {
			checks.vectorize = false;
		}

		// Check if AI is available
		try {
			checks.ai = !!env.AI;
		} catch {
			checks.ai = false;
		}

		const allHealthy = Object.values(checks).every((check) => check);

		return c.json(
			{
				status: allHealthy ? "healthy" : "degraded",
				timestamp: new Date().toISOString(),
				checks,
			},
			allHealthy ? 200 : 503,
		);
	} catch (error) {
		logger.error({ error }, "Health check failed");

		return c.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				error: (error as Error).message,
			},
			503,
		);
	}
});
