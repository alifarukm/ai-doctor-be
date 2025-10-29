import type { D1Database } from "@cloudflare/workers-types";
import type { ExtractedSymptoms, MatchedSymptom } from "../types";
import { NLPError } from "../utils/errors";
import { logger } from "../utils/logger";
import { normalizeText, similarityScore } from "../utils/helpers";

export class NLPService {
	constructor(
		private ai: Ai,
		private db: D1Database,
		private nlpModel: string,
	) {}

	/**
	 * Extract symptoms from natural language text using AI
	 */
	async extractSymptomsFromText(message: string): Promise<ExtractedSymptoms> {
		try {
			logger.info({ message }, "Extracting symptoms from message");

			const prompt = `You are a medical symptom extractor. Extract ONLY the medical symptoms from this patient message.
Return the symptoms as a simple comma-separated list, nothing else. Do not include explanations or additional text.

Examples:
Patient: "I have a headache and fever" → headache, fever
Patient: "my throat hurts and I'm coughing" → sore throat, cough
Patient: "feeling dizzy with stomach pain" → dizziness, stomach pain

Patient message: "${message}"

Extracted symptoms:`;

			const response = await this.ai.run(this.nlpModel, {
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				max_tokens: 150,
				temperature: 0.3,
			});

			// Parse AI response
			const extractedText = (response as { response?: string })?.response || "";
			const symptoms = extractedText
				.split(",")
				.map((s) => normalizeText(s))
				.filter((s) => s.length > 2);

			logger.info({ symptoms, count: symptoms.length }, "Symptoms extracted");

			return {
				originalMessage: message,
				extractedSymptoms: symptoms,
				confidence: 0.9,
				unrecognizedTerms: [],
			};
		} catch (error) {
			logger.error({ error }, "Error extracting symptoms");
			throw new NLPError(
				"Failed to extract symptoms from message",
				(error as Error).message,
			);
		}
	}

	/**
	 * Validate and match extracted symptoms against database symptoms
	 */
	async validateAndMatchSymptoms(
		extractedSymptoms: string[],
	): Promise<MatchedSymptom[]> {
		try {
			logger.info(
				{ symptomCount: extractedSymptoms.length },
				"Validating symptoms",
			);

			// Get all known symptoms from database
			const knownSymptomsResult = await this.db
				.prepare("SELECT id, name, description FROM symptoms")
				.all();

			const knownSymptoms = knownSymptomsResult.results as Array<{
				id: number;
				name: string;
				description: string | null;
			}>;

			const matched: MatchedSymptom[] = [];

			for (const extracted of extractedSymptoms) {
				// Try exact match first
				let match = knownSymptoms.find(
					(s) => normalizeText(s.name) === normalizeText(extracted),
				);

				let confidence = 1.0;

				// If no exact match, try fuzzy matching
				if (!match) {
					const fuzzyMatch = this.fuzzyMatchSymptom(extracted, knownSymptoms);
					if (fuzzyMatch) {
						match = fuzzyMatch.symptom;
						confidence = fuzzyMatch.score;
					}
				}

				if (match && confidence >= 0.6) {
					matched.push({
						symptomId: match.id,
						symptomName: match.name,
						userSaid: extracted,
						confidence,
					});
				}
			}

			logger.info(
				{ matched: matched.length, total: extractedSymptoms.length },
				"Symptoms validated",
			);

			return matched;
		} catch (error) {
			logger.error({ error }, "Error validating symptoms");
			throw new NLPError(
				"Failed to validate symptoms",
				(error as Error).message,
			);
		}
	}

	/**
	 * Fuzzy match a symptom against known symptoms
	 */
	private fuzzyMatchSymptom(
		input: string,
		knownSymptoms: Array<{
			id: number;
			name: string;
			description: string | null;
		}>,
	): {
		symptom: { id: number; name: string; description: string | null };
		score: number;
	} | null {
		let bestMatch: {
			symptom: (typeof knownSymptoms)[0];
			score: number;
		} | null = null;
		let bestScore = 0;

		for (const symptom of knownSymptoms) {
			const score = similarityScore(input, symptom.name);

			if (score > bestScore && score > 0.6) {
				bestScore = score;
				bestMatch = { symptom, score };
			}
		}

		return bestMatch;
	}
}
