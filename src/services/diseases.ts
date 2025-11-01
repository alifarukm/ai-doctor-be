import type { PrismaClient } from "@/libs/prisma-client";

export class DiseasesService {
	constructor(private prisma: PrismaClient) {}

	async getAllDiseases() {
		return this.prisma.diseases.findMany({});
	}

	/**
	 * Using this method will clear all vector IDs from diseases when re generating embeddings
	 */
	async clearVectorsFromDiseases() {
		return this.prisma.diseases.updateMany({
			data: {
				vector_id: null,
			},
		});
	}
}
