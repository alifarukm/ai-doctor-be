import { Hono } from "hono";
import type { CloudflareBindings } from "@/types";

// @ts-expect-error
import index from "./index.html";

export const pagesRouter = new Hono<{ Bindings: CloudflareBindings }>();

pagesRouter.get("/hello", async (c) => {
	return c.html(index);
});
