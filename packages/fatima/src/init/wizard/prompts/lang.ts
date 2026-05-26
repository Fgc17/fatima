import { select } from "@inquirer/prompts";
import type { Generator } from "../../types";

export const askLanguage = async () =>
	(await select({
		message: "Choose the generator you want to use",
		choices: [
			{
				name: "TypeScript (.ts)",
				value: "typescript",
			},
			{
				name: "JavaScript (.js)",
				value: "javascript",
				description: "Fatima provides full type safety via JSDoc.",
			},
			{
				name: "Python (.py)",
				value: "python",
			},
		],
	})) as Generator;
