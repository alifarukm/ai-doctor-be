/**
 * Entity types that can have embeddings
 */
export type EntityType = "disease" | "symptom" | "treatment" | "query";

/**
 * Request to generate an embedding
 */
export type EmbeddingRequest = {
	text: string;
	entityType: EntityType;
	entityId: string;
};

/**
 * Generated embedding response
 */
export type EmbeddingResponse = {
	vectorId: string;
	embedding: number[];
	model: string;
	dimensions: number;
};

/**
 * Metadata stored with vectors in Vectorize
 */
export type VectorMetadata = {
	entityType: EntityType;
	entityId: number | string;
	name: string;
	description?: string;
	createdAt: string;
};

/**
 * Result from vector similarity search
 */
export type VectorSearchResult = {
	id: string;
	score: number;
	metadata: VectorMetadata;
};

/**
 * Batch embedding generation request
 */
export type BatchEmbeddingRequest = {
	items: Array<{
		text: string;
		entityType: EntityType;
		entityId: string;
	}>;
};

/**
 * Batch embedding generation response
 */
export type BatchEmbeddingResponse = {
	generated: number;
	failed: number;
	errors: Array<{
		entityId: string;
		error: string;
	}>;
};
