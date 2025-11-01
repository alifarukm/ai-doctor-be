import { Hono } from "hono";
import type { CloudflareBindings } from "@/types";
import { chatRouter } from "./chat";
import { diseasesRouter } from "./diseases";
import { embeddingsRouter } from "./embeddings";
import { pagesRouter } from "./pages";

export default function routers() {
	const app = new Hono<{ Bindings: CloudflareBindings }>();

	// UI
	app.route("/", pagesRouter);

	// Mount routers
	app.route("/api/chat", chatRouter);
	app.route("/api/embeddings", embeddingsRouter);
	app.route("/api/diseases", diseasesRouter);

	return app;
}
