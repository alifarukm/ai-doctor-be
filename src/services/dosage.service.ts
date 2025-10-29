import type { D1Database } from "@cloudflare/workers-types";
import type {
	PatientInfo,
	MedicationRecommendation,
	DosageInfo,
} from "../types";
import { DatabaseError } from "../utils/errors";
import { logger } from "../utils/logger";
import { formatDosage } from "../utils/helpers";

export class DosageService {
	constructor(private db: D1Database) {}

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

			// Get all treatments for this disease
			const treatmentsResult = await this.db
				.prepare(
					`SELECT id, type, name, priority, is_required, conditions
					 FROM medications_treatments
					 WHERE disease_id = ?
					 ORDER BY priority ASC`,
				)
				.bind(diseaseId)
				.all();

			const recommendations: MedicationRecommendation[] = [];

			for (const treatment of treatmentsResult.results) {
				const treatmentId = treatment.id as number;

				// Get medications for this treatment with appropriate dosages
				const dosagesResult = await this.db
					.prepare(
						`SELECT
							md.id as dosage_id,
							m.id as medication_id,
							m.generic_name,
							m.type,
							m.contraindications,
							md.dose,
							md.frequency,
							md.duration,
							md.max_single_dose,
							md.max_daily_dose,
							md.administration,
							md.notes,
							md.is_alternative,
							md.allergy_info,
							md.patient_type,
							md.age_min,
							md.age_max,
							md.weight_min,
							md.weight_max
						 FROM medications_dosages md
						 JOIN medications m ON md.medication_id = m.id
						 WHERE md.treatment_id = ?
						 AND md.patient_type = ?`,
					)
					.bind(treatmentId, patientInfo.type)
					.all();

				for (const dosage of dosagesResult.results) {
					// Check if this dosage applies to the patient
					const ageInMonths = patientInfo.age * 12; // Convert years to months
					const ageMin = dosage.age_min as number | null;
					const ageMax = dosage.age_max as number | null;
					const weightMin = dosage.weight_min as number | null;
					const weightMax = dosage.weight_max as number | null;

					// Apply age filter
					if (ageMin !== null && ageInMonths < ageMin) {
						continue;
					}
					if (ageMax !== null && ageInMonths > ageMax) {
						continue;
					}

					// Apply weight filter
					if (weightMin !== null && patientInfo.weight < weightMin) {
						continue;
					}
					if (weightMax !== null && patientInfo.weight > weightMax) {
						continue;
					}

					// Calculate dosage
					const calculatedDose = formatDosage(
						dosage.dose as string,
						patientInfo.weight,
					);

					// Get brand names
					const brandNamesResult = await this.db
						.prepare(
							"SELECT name FROM medications_brand_names WHERE medication_id = ?",
						)
						.bind(dosage.medication_id)
						.all();

					const brandNames = brandNamesResult.results.map(
						(bn) => bn.name as string,
					);

					// Check for allergies
					const warnings: string[] = [];
					if (
						dosage.allergy_info &&
						patientInfo.allergies?.some((a) =>
							(dosage.allergy_info as string)
								.toLowerCase()
								.includes(a.toLowerCase()),
						)
					) {
						warnings.push(`Warning: ${dosage.allergy_info as string}`);
					}

					const dosageInfo: DosageInfo = {
						calculatedDose,
						frequency: dosage.frequency as string,
						duration: dosage.duration as string,
						maxSingleDose: (dosage.max_single_dose as string) || undefined,
						maxDailyDose: (dosage.max_daily_dose as string) || undefined,
						administration: (dosage.administration as string) || undefined,
						notes: (dosage.notes as string) || undefined,
					};

					const recommendation: MedicationRecommendation = {
						medicationId: dosage.medication_id as number,
						genericName: dosage.generic_name as string,
						brandNames,
						type: dosage.type as string,
						dosage: dosageInfo,
						contraindications: dosage.contraindications
							? [dosage.contraindications as string]
							: undefined,
						warnings: warnings.length > 0 ? warnings : undefined,
						priority: treatment.priority as number,
						isRequired: Boolean(treatment.is_required),
						isAlternative: Boolean(dosage.is_alternative),
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

	/**
	 * Check medication contraindications for patient
	 */
	private checkContraindications(
		contraindications: string | null,
		patientInfo: PatientInfo,
	): string[] {
		const warnings: string[] = [];

		if (!contraindications) {
			return warnings;
		}

		// Check for allergy-related contraindications
		if (patientInfo.allergies) {
			for (const allergy of patientInfo.allergies) {
				if (contraindications.toLowerCase().includes(allergy.toLowerCase())) {
					warnings.push(`Contraindicated due to ${allergy} allergy`);
				}
			}
		}

		return warnings;
	}
}
