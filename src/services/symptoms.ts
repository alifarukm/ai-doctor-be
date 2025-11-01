import type { PrismaClient } from "@/libs/prisma-client";

export class SymptomsService {
	constructor(private prisma: PrismaClient) {}

	async getAllSymptoms() {
		return this.prisma.symptoms.findMany({});
	}

	/**
	 * Using this method will clear all vector IDs from symptoms when re generating embeddings
	 */
	async clearVectorsFromSymptoms() {
		return this.prisma.symptoms.updateMany({
			data: {
				vector_id: null,
			},
		});
	}
}
