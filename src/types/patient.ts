/**
 * Patient type enum
 */
export type PatientType = "pediatric" | "adult";

/**
 * Patient information for diagnosis
 */
export type PatientInfo = {
	age: number;
	weight: number;
	type: PatientType;
	allergies?: string[];
};

/**
 * Complete patient profile
 */
export type PatientProfile = {
	id: string;
	email: string;
	name?: string;
	age: number;
	weight: number;
	type: PatientType;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Diagnosis history entry
 */
export type DiagnosisHistory = {
	queryId: string;
	sessionId?: string;
	symptoms: string;
	diagnosedDiseases: unknown;
	confidence: number;
	createdAt: Date;
};
