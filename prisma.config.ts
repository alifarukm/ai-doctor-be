import { PrismaD1 } from "@prisma/adapter-d1";
import type { PrismaConfig } from "prisma";

// import your .env file
import "dotenv/config";

export default {
	experimental: {
		adapter: true,
	},
	schema: "src/lib/prisma/schema.prisma",
	async adapter() {
		return new PrismaD1({
			CLOUDFLARE_D1_TOKEN: process.env.CLOUDFLARE_D1_TOKEN!,
			CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID!,
			CLOUDFLARE_DATABASE_ID: process.env.CLOUDFLARE_DATABASE_ID!,
		});
	},
} satisfies PrismaConfig;
