import type { PrismaClient } from "@/libs/prisma-client";

export class DiseasesService {
	constructor(private prisma: PrismaClient) {}

	async getAllDiseases() {
		return this.prisma.diseases.findMany({});
	}
}
