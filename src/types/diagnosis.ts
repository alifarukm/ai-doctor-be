import type { PatientInfo } from "./patient";

/**
 * Natural language diagnosis request
 */
export type DiagnosisRequest = {
	message: string;
	patientInfo: PatientInfo;
	sessionId?: string;
};

/**
 * Extracted symptoms from natural language
 */
export type ExtractedSymptoms = {
	originalMessage: string;
	extractedSymptoms: string[];
	confidence: number;
	unrecognizedTerms?: string[];
};

/**
 * Matched symptom with confidence
 */
export type MatchedSymptom = {
	symptomId: number;
	symptomName: string;
	userSaid: string;
	confidence: number;
	isPrimary?: boolean;
	importance?: number;
};

/**
 * Single diagnosis result
 */
export type DiagnosisResult = {
	diseaseId: number;
	diseaseName: string;
	description?: string;
	category?: string;
	confidence: number;
	matchedSymptoms: MatchedSymptom[];
	diagnosticCriteria: string[];
	vectorScore?: number;
	graphScore?: number;
};

/**
 * Dosage information for a medication
 */
export type DosageInfo = {
	calculatedDose: string;
	frequency: string;
	duration: string;
	maxSingleDose?: string;
	maxDailyDose?: string;
	administration?: string;
	notes?: string;
};

/**
 * Medication recommendation with dosage
 */
export type MedicationRecommendation = {
	medicationId: number;
	genericName: string;
	brandNames: string[];
	type: string;
	dosage: DosageInfo;
	contraindications?: string[];
	warnings?: string[];
	priority: number;
	isRequired: boolean;
	isAlternative: boolean;
};

/**
 * Supportive care recommendation
 */
export type SupportiveCareItem = {
	category: string;
	title: string;
	description: string;
	priority: number;
};

/**
 * Complete diagnosis response
 */
export type DiagnosisResponse = {
	extractedSymptoms: {
		identified: string[];
		confidence: number;
	};
	results: DiagnosisResult[];
	recommendations: MedicationRecommendation[];
	supportiveCare: SupportiveCareItem[];
	overallConfidence: number;
	sessionId?: string;
	timestamp: string;
};

/**
 * Disease graph node with all relationships
 */
export type DiseaseGraphNode = {
	diseaseId: number;
	diseaseName: string;
	description?: string;
	category?: string;
	symptoms: Array<{
		id: number;
		name: string;
		isPrimary: boolean;
		importance: number;
		description?: string;
	}>;
	treatments: Array<{
		id: number;
		type: string;
		name: string;
		priority: number;
		isRequired: boolean;
		conditions?: string;
	}>;
	diagnosticCriteria: Array<{
		criteria: string;
		type: string;
		priority: number;
	}>;
	supportiveCare: Array<{
		category: string;
		title: string;
		description: string;
		priority: number;
	}>;
};

/**
 * Symptom match calculation
 */
export type SymptomMatch = {
	symptomId: number;
	symptomName: string;
	userSaid: string;
	confidence: number;
	isPrimary: boolean;
	importance: number;
};

/**
 * Disease candidate from hybrid search
 */
export type DiseaseCandidate = {
	diseaseId: number;
	vectorScore: number;
	graphScore: number;
	combinedScore: number;
	graphNode: DiseaseGraphNode;
};
