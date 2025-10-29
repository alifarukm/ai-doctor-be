/**
 * Calculate Levenshtein distance between two strings (for fuzzy matching)
 */
export function levenshteinDistance(str1: string, str2: string): number {
	const s1 = str1.toLowerCase();
	const s2 = str2.toLowerCase();

	const costs: number[] = [];
	for (let i = 0; i <= s1.length; i++) {
		let lastValue = i;
		for (let j = 0; j <= s2.length; j++) {
			if (i === 0) {
				costs[j] = j;
			} else if (j > 0) {
				let newValue = costs[j - 1];
				if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
					newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
				}
				costs[j - 1] = lastValue;
				lastValue = newValue;
			}
		}
		if (i > 0) {
			costs[s2.length] = lastValue;
		}
	}
	return costs[s2.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function similarityScore(str1: string, str2: string): number {
	const distance = levenshteinDistance(str1, str2);
	const maxLength = Math.max(str1.length, str2.length);
	return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Normalize text for comparison
 */
export function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s]/g, "")
		.replace(/\s+/g, " ");
}

/**
 * Format dosage expression (convert mg/kg to actual mg)
 */
export function formatDosage(dose: string, weight: number): string {
	// Match patterns like "90 mg/kg/gün" or "15mg/kg"
	const mgPerKgMatch = dose.match(/(\d+(?:\.\d+)?)\s*mg\/kg/i);

	if (mgPerKgMatch) {
		const dosePerKg = Number.parseFloat(mgPerKgMatch[1]);
		const calculatedDose = dosePerKg * weight;
		return dose.replace(mgPerKgMatch[0], `${calculatedDose} mg`);
	}

	return dose;
}

/**
 * Group array items by a key
 */
export function groupBy<T>(items: T[], key: keyof T): Map<unknown, T[]> {
	return items.reduce((groups, item) => {
		const keyValue = item[key];
		const group = groups.get(keyValue) || [];
		group.push(item);
		groups.set(keyValue, group);
		return groups;
	}, new Map<unknown, T[]>());
}

/**
 * Calculate statistical measures for scores
 */
export function calculateStats(scores: number[]): {
	min: number;
	max: number;
	mean: number;
	median: number;
} {
	if (scores.length === 0) {
		return { min: 0, max: 0, mean: 0, median: 0 };
	}

	const sorted = [...scores].sort((a, b) => a - b);
	const sum = scores.reduce((acc, val) => acc + val, 0);

	return {
		min: sorted[0],
		max: sorted[sorted.length - 1],
		mean: sum / scores.length,
		median:
			sorted.length % 2 === 0
				? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
				: sorted[Math.floor(sorted.length / 2)],
	};
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	delayMs = 1000,
): Promise<T> {
	let lastError: Error | undefined;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;
			if (i < maxRetries - 1) {
				await sleep(delayMs * 2 ** i);
			}
		}
	}

	throw lastError;
}
