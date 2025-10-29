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
	// LLM Configuration
	LLM_PROVIDER: string; // "openai" | "gemini" | "anthropic"
	LLM_API_KEY: string;
	LLM_MODEL: string;
	LLM_TEMPERATURE?: string;
	LLM_MAX_TOKENS?: string;
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
