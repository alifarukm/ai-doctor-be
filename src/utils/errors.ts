/**
 * Base error class for the application
 */
export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly statusCode: number = 500,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, "VALIDATION_ERROR", 400, details);
	}
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
	constructor(message: string, cause?: Error) {
		super(message, "DATABASE_ERROR", 500, { cause: cause?.message });
	}
}

/**
 * Vectorize error (500)
 */
export class VectorizeError extends AppError {
	constructor(message: string, cause?: Error) {
		super(message, "VECTORIZE_ERROR", 500, { cause: cause?.message });
	}
}

/**
 * Embedding generation error (500)
 */
export class EmbeddingError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, "EMBEDDING_ERROR", 500, details);
	}
}

/**
 * Diagnosis error (500)
 */
export class DiagnosisError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, "DIAGNOSIS_ERROR", 500, details);
	}
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
	constructor(message: string, entityType?: string) {
		super(message, "NOT_FOUND", 404, { entityType });
	}
}

/**
 * NLP extraction error (500)
 */
export class NLPError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, "NLP_ERROR", 500, details);
	}
}
