import type { PrismaClient } from "@/libs/prisma-client";
import type { DiseaseGraphNode, MatchedSymptom, SymptomMatch } from "@/types";
import { DatabaseError, logger } from "@/utils";

export class GraphService {
	constructor(public prisma: PrismaClient) {}

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
				// Get disease with all related data using Prisma includes
				const disease = await this.prisma.diseases.findUnique({
					where: { id: diseaseId },
					include: {
						category: {
							select: {
								name: true,
							},
						},
						symptoms: {
							include: {
								symptom: {
									select: {
										id: true,
										name: true,
									},
								},
							},
							orderBy: {
								importance: "desc",
							},
						},
						treatments: {
							orderBy: {
								priority: "asc",
							},
						},
						diagnosis_criterions: {
							orderBy: {
								priority: "asc",
							},
						},
						supportive_cares: {
							orderBy: {
								priority: "asc",
							},
						},
					},
				});

				if (!disease) {
					continue;
				}

				const graphNode: DiseaseGraphNode = {
					diseaseId: disease.id,
					diseaseName: disease.name,
					description: disease.description || undefined,
					category: disease.category?.name || undefined,
					symptoms: disease.symptoms.map((ds) => ({
						id: ds.symptom.id,
						name: ds.symptom.name,
						isPrimary: ds.is_primary,
						importance: ds.importance,
						description: ds.description || undefined,
					})),
					treatments: disease.treatments.map((t) => ({
						id: t.id,
						type: t.type,
						name: t.name,
						priority: t.priority,
						isRequired: t.is_required,
						conditions: t.conditions || undefined,
					})),
					diagnosticCriteria: disease.diagnosis_criterions.map((c) => ({
						criteria: c.criteria,
						type: c.type,
						priority: c.priority,
					})),
					supportiveCare: disease.supportive_cares.map((sc) => ({
						category: sc.category,
						title: sc.title,
						description: sc.description,
						priority: sc.priority,
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

		// Multi-symptom boosting
		let boostedScore = normalizedScore;
		const matchRatio =
			symptomMatches.length / Math.max(diseaseGraphNode.symptoms.length, 1);

		// Bonus 1: Multiple symptom matches (3+)
		if (symptomMatches.length >= 3) {
			const matchBonus = 0.15; // 15% bonus
			boostedScore = normalizedScore * (1 + matchBonus);

			logger.debug(
				{
					diseaseId: diseaseGraphNode.diseaseId,
					matchCount: symptomMatches.length,
					bonus: matchBonus,
				},
				"Multi-symptom boost applied",
			);
		}

		// Bonus 2: High match ratio (70%+)
		if (matchRatio > 0.7) {
			const ratioBonus = 0.1; // 10% bonus
			boostedScore = boostedScore * (1 + ratioBonus);

			logger.debug(
				{
					diseaseId: diseaseGraphNode.diseaseId,
					matchRatio,
					bonus: ratioBonus,
				},
				"High match ratio boost applied",
			);
		}

		return Math.min(boostedScore, 1.0);
	}

	/**
	 * Evaluate negative diagnostic criteria (differential diagnosis)
	 * Returns penalty score (0-0.5) if patient symptoms conflict with negative criteria
	 */
	async evaluateNegativeCriteria(
		diseaseId: number,
		matchedSymptoms: MatchedSymptom[],
	): Promise<number> {
		try {
			// Get negative criteria for this disease
			const negativeCriteria = await this.prisma.diagnosis_criterions.findMany({
				where: {
					disease_id: diseaseId,
					type: "negative",
				},
				orderBy: {
					priority: "asc",
				},
			});

			if (negativeCriteria.length === 0) {
				return 0; // No negative criteria = no penalty
			}

			// Extract symptom names for matching
			const symptomNames = matchedSymptoms.map((s) =>
				s.symptomName.toLowerCase(),
			);

			let penaltyScore = 0;

			for (const criterion of negativeCriteria) {
				// Simple keyword matching
				// Future: can be enhanced with NLP/LLM for semantic matching
				const keywords = criterion.criteria
					.toLowerCase()
					.split(/[\s,]+/)
					.filter((k) => k.length > 3); // Filter short words

				// Check if any symptom matches negative criteria keywords
				const hasConflict = keywords.some((keyword) =>
					symptomNames.some(
						(symptom) => symptom.includes(keyword) || keyword.includes(symptom),
					),
				);

				if (hasConflict) {
					// Higher priority (lower number) = higher penalty
					const criteriaPenalty = (1 / criterion.priority) * 0.15;
					penaltyScore += criteriaPenalty;

					logger.debug(
						{
							diseaseId,
							criterion: criterion.criteria,
							penalty: criteriaPenalty,
						},
						"Negative criteria conflict detected",
					);
				}
			}

			// Cap penalty at 50%
			return Math.min(penaltyScore, 0.5);
		} catch (error) {
			logger.error({ error, diseaseId }, "Error evaluating negative criteria");
			return 0;
		}
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
			// Use Prisma to get disease symptoms with relations
			const diseaseSymptoms = await this.prisma.disease_symptoms.findMany({
				where: {
					disease_id: {
						in: diseaseIds,
					},
				},
				include: {
					symptom: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			const symptomsMap = new Map<
				number,
				Array<{ id: number; name: string; isPrimary: boolean }>
			>();

			for (const ds of diseaseSymptoms) {
				if (!symptomsMap.has(ds.disease_id)) {
					symptomsMap.set(ds.disease_id, []);
				}
				symptomsMap.get(ds.disease_id)?.push({
					id: ds.symptom.id,
					name: ds.symptom.name,
					isPrimary: ds.is_primary,
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
