import type { Context, Next } from "hono";
import { AppError, logger } from "@/utils";

/**
 * Global error handling middleware
 */
export async function errorHandler(c: Context, next: Next) {
	try {
		await next();
	} catch (error) {
		logger.error({ error, path: c.req.path }, "Request error");

		// Handle known application errors
		if (error instanceof AppError) {
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

		// Handle unknown errors
		return c.json(
			{
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An unexpected error occurred",
				},
				timestamp: new Date().toISOString(),
			},
			500,
		);
	}
}
