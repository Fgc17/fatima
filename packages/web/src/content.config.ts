import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const docs = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		order: z.number().int().nonnegative().optional(),
		navTitle: z.string().optional(),
	}),
});

export const collections = { docs };
