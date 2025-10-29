import { Hono } from "hono";
import type { CloudflareBindings } from "../types";
import { diagnosisRouter } from "./diagnosis";
import { embeddingsRouter } from "./embeddings";

export default function routers() {
	const app = new Hono<{ Bindings: CloudflareBindings }>();

	// Mount routers
	app.route("/api", diagnosisRouter);
	app.route("/api/embeddings", embeddingsRouter);

	return app;
}
