import type {
	D1Database,
	KVNamespace,
	Vectorize,
} from "@cloudflare/workers-types";

/**
 * Cloudflare Workers bindings
 */
export type CloudflareBindings = {
	DB: D1Database;
	AI: Ai;
	VECTORIZE: Vectorize;
	MY_KV?: KVNamespace;
	EMBEDDING_MODEL: string;
	NLP_MODEL: string;
	EMBEDDING_DIMENSIONS: string;
	VECTOR_SEARCH_LIMIT: string;
	VECTOR_SEARCH_THRESHOLD: string;
};

/**
 * Request context with bindings
 */
export type RequestContext = {
	Variables: {
		bindings: CloudflareBindings;
	};
};

/**
 * Standardized API response wrapper
 */
export type ApiResponse<T = unknown> = {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
	timestamp: string;
};

/**
 * Pagination options for list endpoints
 */
export type PaginationOptions = {
	page?: number;
	limit?: number;
	offset?: number;
};

/**
 * Base service dependencies
 */
export type ServiceDependencies = {
	db: D1Database;
	ai: Ai;
	vectorize: Vectorize;
	env: CloudflareBindings;
};
