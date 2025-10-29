import type { PrismaClient } from "../../lib/prisma-client";
import type { DiseaseGraphNode, MatchedSymptom, SymptomMatch } from "../types";
import { DatabaseError } from "../utils/errors";
import { logger } from "../utils/logger";

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
