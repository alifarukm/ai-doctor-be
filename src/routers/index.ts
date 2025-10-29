import { Hono } from "hono";
import type { CloudflareBindings } from "../types";
import { diagnosisRouter } from "./diagnosis";
import { embeddingsRouter } from "./embeddings";
import { healthRouter } from "./health";

/**
 * Create and configure all application routers
 */
export function createAppRouters() {
	const app = new Hono<{ Bindings: CloudflareBindings }>();

	// Mount routers
	app.route("/api", diagnosisRouter);
	app.route("/api/embeddings", embeddingsRouter);
	app.route("/health", healthRouter);

	return app;
}
