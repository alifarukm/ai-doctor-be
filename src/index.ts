import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import type { CloudflareBindings } from "./types";
import { createAppRouters } from "./routers";
import { errorHandler } from "./middleware";
import { logger } from "./utils/logger";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Global middleware
app.use("*", honoLogger());
app.use("*", cors());
app.use("*", errorHandler);

// Mount application routers
const routers = createAppRouters();
app.route("/", routers);

// Root endpoint
app.get("/", (c) => {
	return c.json({
		name: "AI Doctor Backend",
		version: "1.0.0",
		status: "running",
		endpoints: {
			health: "/health",
			diagnose: "/api/diagnose",
			embeddings: "/api/embeddings/generate",
		},
	});
});

// 404 handler
app.notFound((c) => {
	return c.json(
		{
			success: false,
			error: {
				code: "NOT_FOUND",
				message: "The requested endpoint does not exist",
			},
			timestamp: new Date().toISOString(),
		},
		404,
	);
});

// Log startup
logger.info("AI Doctor Backend initialized");

export default app;
