import type { PrismaClient } from "@prisma/client";
import type {
	ExtractedSymptoms,
	DiagnosisResult,
	PatientInfo,
} from "../types/diagnosis";
import { ServiceError } from "../utils/errors";

/**
 * LLM Provider types
 */
export type LLMProvider = "openai" | "gemini" | "anthropic" | "cloudflare";

export type LLMConfig = {
	provider: LLMProvider;
	apiKey: string;
	model: string;
	temperature?: number;
	maxTokens?: number;
};

/**
 * LLM Response structure
 */
export type LLMResponse = {
	text: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
};

/**
 * LLM Service for advanced symptom extraction and diagnosis reasoning
 * Supports multiple LLM providers: OpenAI, Gemini, Anthropic, Cloudflare AI
 */
export class LLMService {
	constructor(
		private config: LLMConfig,
		private prisma: PrismaClient,
	) {}

	/**
	 * Extract symptoms from natural language using LLM
	 */
	async extractSymptoms(message: string): Promise<ExtractedSymptoms> {
		// Get all known symptoms from database for context
		const knownSymptoms = await this.prisma.symptoms.findMany({
			select: {
				name: true,
				description: true,
			},
			take: 100, // Top 100 most common symptoms
		});

		const symptomsList = knownSymptoms
			.map((s) => `- ${s.name}: ${s.description}`)
			.join("\n");

		const prompt = `You are a medical AI assistant. Extract symptoms from the patient's message and match them to known medical symptoms.

Patient's message: "${message}"

Known symptoms in our database:
${symptomsList}

Instructions:
1. Identify all symptoms mentioned in the patient's message
2. Match them to the closest known symptoms from our database
3. Extract severity if mentioned (mild, moderate, severe)
4. Extract duration if mentioned (hours, days, weeks)
5. Return a JSON array of extracted symptoms

Return ONLY a JSON object in this exact format:
{
  "symptoms": [
    {
      "name": "symptom name from database",
      "confidence": 0.95,
      "severity": "moderate",
      "duration": "2 days"
    }
  ]
}`;

		try {
			const response = await this.callLLM(prompt);
			const parsed = this.parseSymptomResponse(response.text);
			return {
				extractedSymptoms: parsed.symptoms.map((s) => s.name),
				confidence: this.calculateAverageConfidence(parsed.symptoms),
				metadata: {
					details: parsed.symptoms,
					rawMessage: message,
				},
			};
		} catch (error) {
			throw new ServiceError(
				"LLM_EXTRACTION_ERROR",
				"Failed to extract symptoms using LLM",
				{ originalError: error },
			);
		}
	}

	/**
	 * Generate diagnosis reasoning and explanation
	 */
	async generateDiagnosisExplanation(
		symptoms: string[],
		diagnosisResults: DiagnosisResult[],
		patientInfo: PatientInfo,
	): Promise<string> {
		const symptomsText = symptoms.join(", ");
		const diseasesText = diagnosisResults
			.slice(0, 3)
			.map(
				(d) =>
					`- ${d.disease.name} (${(d.confidence * 100).toFixed(1)}% confidence)`,
			)
			.join("\n");

		const prompt = `You are a medical AI assistant. Generate a clear, empathetic explanation for the patient.

Patient Information:
- Age: ${patientInfo.age} years
- Weight: ${patientInfo.weight} kg
- Type: ${patientInfo.type}

Reported Symptoms: ${symptomsText}

Possible Diagnoses:
${diseasesText}

Instructions:
1. Explain the possible conditions in simple, non-technical language
2. Describe why these conditions match the symptoms
3. Emphasize this is preliminary and they should see a doctor
4. Be empathetic and reassuring
5. Keep it concise (2-3 paragraphs)

Generate the explanation:`;

		try {
			const response = await this.callLLM(prompt);
			return response.text.trim();
		} catch (error) {
			// Fallback to simple explanation if LLM fails
			return `Based on your symptoms (${symptomsText}), you may have ${diagnosisResults[0]?.disease.name}. Please consult a healthcare professional for proper diagnosis and treatment.`;
		}
	}

	/**
	 * Analyze symptoms and suggest additional questions
	 */
	async suggestFollowUpQuestions(
		symptoms: string[],
		diagnosisResults: DiagnosisResult[],
	): Promise<string[]> {
		const symptomsText = symptoms.join(", ");
		const topDisease = diagnosisResults[0]?.disease.name || "unknown condition";

		const prompt = `You are a medical AI assistant. Suggest 3-5 relevant follow-up questions to better understand the patient's condition.

Reported Symptoms: ${symptomsText}
Most Likely Condition: ${topDisease}

Instructions:
1. Ask about symptom duration, severity, or patterns
2. Ask about relevant medical history
3. Ask about triggers or relieving factors
4. Keep questions simple and direct
5. Return as a JSON array of strings

Return ONLY a JSON array:
["Question 1?", "Question 2?", "Question 3?"]`;

		try {
			const response = await this.callLLM(prompt);
			const questions = JSON.parse(response.text.trim());
			return Array.isArray(questions) ? questions : [];
		} catch (error) {
			// Fallback questions
			return [
				"How long have you had these symptoms?",
				"Have you had any similar episodes before?",
				"Are you taking any medications?",
			];
		}
	}

	/**
	 * Call the configured LLM provider
	 */
	private async callLLM(prompt: string): Promise<LLMResponse> {
		switch (this.config.provider) {
			case "openai":
				return await this.callOpenAI(prompt);
			case "gemini":
				return await this.callGemini(prompt);
			case "anthropic":
				return await this.callAnthropic(prompt);
			case "cloudflare":
				return await this.callCloudflareAI(prompt);
			default:
				throw new ServiceError(
					"UNSUPPORTED_PROVIDER",
					`LLM provider ${this.config.provider} is not supported`,
				);
		}
	}

	/**
	 * Call OpenAI API
	 */
	private async callOpenAI(prompt: string): Promise<LLMResponse> {
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.config.apiKey}`,
			},
			body: JSON.stringify({
				model: this.config.model || "gpt-4-turbo-preview",
				messages: [{ role: "user", content: prompt }],
				temperature: this.config.temperature || 0.7,
				max_tokens: this.config.maxTokens || 1000,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenAI API error: ${error}`);
		}

		const data = await response.json();
		return {
			text: data.choices[0]?.message?.content || "",
			usage: {
				promptTokens: data.usage?.prompt_tokens || 0,
				completionTokens: data.usage?.completion_tokens || 0,
				totalTokens: data.usage?.total_tokens || 0,
			},
		};
	}

	/**
	 * Call Google Gemini API
	 */
	private async callGemini(prompt: string): Promise<LLMResponse> {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || "gemini-pro"}:generateContent?key=${this.config.apiKey}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [{ text: prompt }],
						},
					],
					generationConfig: {
						temperature: this.config.temperature || 0.7,
						maxOutputTokens: this.config.maxTokens || 1000,
					},
				}),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Gemini API error: ${error}`);
		}

		const data = await response.json();
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

		return {
			text,
			usage: {
				promptTokens: data.usageMetadata?.promptTokenCount || 0,
				completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
				totalTokens: data.usageMetadata?.totalTokenCount || 0,
			},
		};
	}

	/**
	 * Call Anthropic Claude API
	 */
	private async callAnthropic(prompt: string): Promise<LLMResponse> {
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.config.apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: this.config.model || "claude-3-sonnet-20240229",
				messages: [{ role: "user", content: prompt }],
				temperature: this.config.temperature || 0.7,
				max_tokens: this.config.maxTokens || 1000,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Anthropic API error: ${error}`);
		}

		const data = await response.json();
		return {
			text: data.content?.[0]?.text || "",
			usage: {
				promptTokens: data.usage?.input_tokens || 0,
				completionTokens: data.usage?.output_tokens || 0,
				totalTokens:
					(data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
			},
		};
	}

	/**
	 * Call Cloudflare AI (fallback)
	 */
	private async callCloudflareAI(prompt: string): Promise<LLMResponse> {
		throw new ServiceError(
			"CLOUDFLARE_AI_NOT_CONFIGURED",
			"Cloudflare AI requires AI binding - use other LLM providers",
		);
	}

	/**
	 * Parse symptom extraction response from LLM
	 */
	private parseSymptomResponse(text: string): {
		symptoms: Array<{
			name: string;
			confidence: number;
			severity?: string;
			duration?: string;
		}>;
	} {
		try {
			// Try to extract JSON from the response
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No JSON found in response");
			}

			const parsed = JSON.parse(jsonMatch[0]);
			return {
				symptoms: parsed.symptoms || [],
			};
		} catch (error) {
			throw new ServiceError(
				"PARSE_ERROR",
				"Failed to parse LLM symptom response",
				{ originalText: text, error },
			);
		}
	}

	/**
	 * Calculate average confidence from symptoms
	 */
	private calculateAverageConfidence(
		symptoms: Array<{ confidence: number }>,
	): number {
		if (symptoms.length === 0) return 0;
		const sum = symptoms.reduce((acc, s) => acc + s.confidence, 0);
		return sum / symptoms.length;
	}
}
