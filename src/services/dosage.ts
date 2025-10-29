import type { PrismaClient } from "@/libs/prisma-client";
import type {
	DosageInfo,
	MedicationRecommendation,
	PatientInfo,
} from "@/types";
import { DatabaseError, formatDosage, logger } from "@/utils";

export class DosageService {
	constructor(private prisma: PrismaClient) {}

	/**
	 * Get medication recommendations for a disease with patient-specific dosages
	 */
	async getMedicationRecommendations(
		diseaseId: number,
		patientInfo: PatientInfo,
	): Promise<MedicationRecommendation[]> {
		try {
			logger.info(
				{ diseaseId, patientInfo },
				"Getting medication recommendations",
			);

			// Get all treatments for this disease using Prisma
			const treatments = await this.prisma.medications_treatments.findMany({
				where: {
					disease_id: diseaseId,
				},
				orderBy: {
					priority: "asc",
				},
			});

			const recommendations: MedicationRecommendation[] = [];

			for (const treatment of treatments) {
				// Convert patient age to months
				const ageInMonths = patientInfo.age * 12;

				// Get medications for this treatment with appropriate dosages using Prisma
				const dosages = await this.prisma.medications_dosages.findMany({
					where: {
						treatment_id: treatment.id,
						patient_type: patientInfo.type,
						// Age filters - only apply if specified
						AND: [
							{
								OR: [{ age_min: null }, { age_min: { lte: ageInMonths } }],
							},
							{
								OR: [{ age_max: null }, { age_max: { gte: ageInMonths } }],
							},
							{
								OR: [
									{ weight_min: null },
									{ weight_min: { lte: patientInfo.weight } },
								],
							},
							{
								OR: [
									{ weight_max: null },
									{ weight_max: { gte: patientInfo.weight } },
								],
							},
						],
					},
					include: {
						medication: {
							include: {
								medications_brand_names: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				});

				for (const dosage of dosages) {
					// Calculate dosage
					const calculatedDose = formatDosage(dosage.dose, patientInfo.weight);

					const brandNames = dosage.medication.medications_brand_names.map(
						(bn) => bn.name,
					);

					// Check for allergies
					const warnings: string[] = [];
					if (
						dosage.allergy_info &&
						patientInfo.allergies?.some((a) =>
							dosage.allergy_info?.toLowerCase().includes(a.toLowerCase()),
						)
					) {
						warnings.push(`Warning: ${dosage.allergy_info}`);
					}

					const dosageInfo: DosageInfo = {
						calculatedDose,
						frequency: dosage.frequency,
						duration: dosage.duration,
						maxSingleDose: dosage.max_single_dose || undefined,
						maxDailyDose: dosage.max_daily_dose || undefined,
						administration: dosage.administration || undefined,
						notes: dosage.notes || undefined,
					};

					const recommendation: MedicationRecommendation = {
						medicationId: dosage.medication.id,
						genericName: dosage.medication.generic_name,
						brandNames,
						type: dosage.medication.type,
						dosage: dosageInfo,
						contraindications: dosage.medication.contraindications
							? [dosage.medication.contraindications]
							: undefined,
						warnings: warnings.length > 0 ? warnings : undefined,
						priority: treatment.priority,
						isRequired: treatment.is_required,
						isAlternative: dosage.is_alternative,
					};

					recommendations.push(recommendation);
				}
			}

			// Sort by priority and whether it's required
			recommendations.sort((a, b) => {
				if (a.isRequired !== b.isRequired) {
					return a.isRequired ? -1 : 1;
				}
				return a.priority - b.priority;
			});

			logger.info(
				{ count: recommendations.length },
				"Medication recommendations complete",
			);

			return recommendations;
		} catch (error) {
			logger.error({ error }, "Error getting medication recommendations");
			throw new DatabaseError(
				"Failed to get medication recommendations",
				error as Error,
			);
		}
	}
}
