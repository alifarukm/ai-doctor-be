import { z } from "zod";

/**
 * Patient info schema
 */
export const PatientInfoSchema = z.object({
	age: z.number().int().min(0).max(150),
	weight: z.number().positive().max(300),
	type: z.enum(["pediatric", "adult"]),
	allergies: z.array(z.string()).optional(),
});

/**
 * Diagnosis request schema
 */
export const DiagnosisRequestSchema = z.object({
	message: z.string().min(10).max(1000),
	patientInfo: PatientInfoSchema,
	sessionId: z.string().uuid().optional(),
});

/**
 * Batch embedding generation schema
 */
export const BatchEmbeddingRequestSchema = z.object({
	entityType: z.enum(["disease", "symptom", "treatment"]),
	entityIds: z.array(z.number()).optional(),
});

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
	page: z.number().int().positive().default(1),
	limit: z.number().int().positive().max(100).default(20),
});
