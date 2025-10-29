import type { D1Database } from "@cloudflare/workers-types";
import type { DiseaseGraphNode, MatchedSymptom, SymptomMatch } from "../types";
import { DatabaseError } from "../utils/errors";
import { logger } from "../utils/logger";

export class GraphService {
	constructor(private db: D1Database) {}

	/**
	 * Traverse disease graph to get all related information
	 */
	async traverseDiseaseGraph(
		diseaseIds: number[],
	): Promise<DiseaseGraphNode[]> {
		try {
			logger.info({ diseaseIds }, "Traversing disease graph");

			const graphNodes: DiseaseGraphNode[] = [];

			for (const diseaseId of diseaseIds) {
				// Get disease basic info
				const diseaseResult = await this.db
					.prepare(
						`SELECT d.id, d.name, d.description, dc.name as category
						 FROM diseases d
						 LEFT JOIN disease_categories dc ON d.category_id = dc.id
						 WHERE d.id = ?`,
					)
					.bind(diseaseId)
					.first();

				if (!diseaseResult) {
					continue;
				}

				// Get disease symptoms
				const symptomsResult = await this.db
					.prepare(
						`SELECT s.id, s.name, ds.is_primary, ds.importance, ds.description
						 FROM disease_symptoms ds
						 JOIN symptoms s ON ds.symptom_id = s.id
						 WHERE ds.disease_id = ?
						 ORDER BY ds.importance DESC`,
					)
					.bind(diseaseId)
					.all();

				// Get treatments
				const treatmentsResult = await this.db
					.prepare(
						`SELECT id, type, name, priority, is_required, conditions
						 FROM medications_treatments
						 WHERE disease_id = ?
						 ORDER BY priority ASC`,
					)
					.bind(diseaseId)
					.all();

				// Get diagnostic criteria
				const criteriaResult = await this.db
					.prepare(
						`SELECT criteria, type, priority
						 FROM diagnosis_criterions
						 WHERE disease_id = ?
						 ORDER BY priority ASC`,
					)
					.bind(diseaseId)
					.all();

				// Get supportive care
				const supportiveCareResult = await this.db
					.prepare(
						`SELECT category, title, description, priority
						 FROM supportive_care
						 WHERE disease_id = ?
						 ORDER BY priority ASC`,
					)
					.bind(diseaseId)
					.all();

				const graphNode: DiseaseGraphNode = {
					diseaseId: diseaseResult.id as number,
					diseaseName: diseaseResult.name as string,
					description: (diseaseResult.description as string) || undefined,
					category: (diseaseResult.category as string) || undefined,
					symptoms: symptomsResult.results.map((s) => ({
						id: s.id as number,
						name: s.name as string,
						isPrimary: Boolean(s.is_primary),
						importance: (s.importance as number) || 1,
						description: (s.description as string) || undefined,
					})),
					treatments: treatmentsResult.results.map((t) => ({
						id: t.id as number,
						type: t.type as string,
						name: t.name as string,
						priority: t.priority as number,
						isRequired: Boolean(t.is_required),
						conditions: (t.conditions as string) || undefined,
					})),
					diagnosticCriteria: criteriaResult.results.map((c) => ({
						criteria: c.criteria as string,
						type: c.type as string,
						priority: c.priority as number,
					})),
					supportiveCare: supportiveCareResult.results.map((sc) => ({
						category: sc.category as string,
						title: sc.title as string,
						description: sc.description as string,
						priority: sc.priority as number,
					})),
				};

				graphNodes.push(graphNode);
			}

			logger.info(
				{ nodes: graphNodes.length },
				"Disease graph traversal complete",
			);

			return graphNodes;
		} catch (error) {
			logger.error({ error }, "Error traversing disease graph");
			throw new DatabaseError(
				"Failed to traverse disease graph",
				error as Error,
			);
		}
	}

	/**
	 * Calculate symptom relevance by matching user symptoms to disease symptoms
	 */
	calculateSymptomRelevance(
		userSymptoms: MatchedSymptom[],
		diseaseGraphNode: DiseaseGraphNode,
	): SymptomMatch[] {
		const matches: SymptomMatch[] = [];

		for (const userSymptom of userSymptoms) {
			const diseaseSymptom = diseaseGraphNode.symptoms.find(
				(ds) => ds.id === userSymptom.symptomId,
			);

			if (diseaseSymptom) {
				matches.push({
					symptomId: userSymptom.symptomId,
					symptomName: userSymptom.symptomName,
					userSaid: userSymptom.userSaid,
					confidence: userSymptom.confidence,
					isPrimary: diseaseSymptom.isPrimary,
					importance: diseaseSymptom.importance,
				});
			}
		}

		return matches;
	}

	/**
	 * Score disease likelihood based on symptom matches
	 */
	scoreDiseaseLikelihood(
		symptomMatches: SymptomMatch[],
		diseaseGraphNode: DiseaseGraphNode,
	): number {
		if (symptomMatches.length === 0) {
			return 0;
		}

		let score = 0;
		let maxPossibleScore = 0;

		// Calculate score based on matched symptoms
		for (const match of symptomMatches) {
			const weight = match.isPrimary ? 0.7 : 0.3;
			const importanceWeight = match.importance / 10; // Normalize importance (1-10 scale)
			const symptomScore = match.confidence * weight * importanceWeight;
			score += symptomScore;
		}

		// Calculate max possible score for this disease
		for (const symptom of diseaseGraphNode.symptoms) {
			const weight = symptom.isPrimary ? 0.7 : 0.3;
			const importanceWeight = symptom.importance / 10;
			maxPossibleScore += weight * importanceWeight;
		}

		// Normalize score to 0-1 range
		const normalizedScore = maxPossibleScore > 0 ? score / maxPossibleScore : 0;

		// Apply penalty if missing critical primary symptoms
		const primarySymptoms = diseaseGraphNode.symptoms.filter(
			(s) => s.isPrimary,
		);
		const matchedPrimarySymptoms = symptomMatches.filter((m) => m.isPrimary);

		if (primarySymptoms.length > 0) {
			const primaryMatchRatio =
				matchedPrimarySymptoms.length / primarySymptoms.length;

			// If less than 50% of primary symptoms matched, apply penalty
			if (primaryMatchRatio < 0.5) {
				return normalizedScore * primaryMatchRatio;
			}
		}

		return Math.min(normalizedScore, 1.0);
	}

	/**
	 * Get all symptoms for multiple diseases (for batch operations)
	 */
	async getDiseasesSymptoms(
		diseaseIds: number[],
	): Promise<
		Map<number, Array<{ id: number; name: string; isPrimary: boolean }>>
	> {
		try {
			const placeholders = diseaseIds.map(() => "?").join(",");

			const result = await this.db
				.prepare(
					`SELECT ds.disease_id, s.id, s.name, ds.is_primary
					 FROM disease_symptoms ds
					 JOIN symptoms s ON ds.symptom_id = s.id
					 WHERE ds.disease_id IN (${placeholders})`,
				)
				.bind(...diseaseIds)
				.all();

			const symptomsMap = new Map<
				number,
				Array<{ id: number; name: string; isPrimary: boolean }>
			>();

			for (const row of result.results) {
				const diseaseId = row.disease_id as number;
				if (!symptomsMap.has(diseaseId)) {
					symptomsMap.set(diseaseId, []);
				}
				symptomsMap.get(diseaseId)?.push({
					id: row.id as number,
					name: row.name as string,
					isPrimary: Boolean(row.is_primary),
				});
			}

			return symptomsMap;
		} catch (error) {
			logger.error({ error }, "Error getting diseases symptoms");
			throw new DatabaseError(
				"Failed to get diseases symptoms",
				error as Error,
			);
		}
	}
}
