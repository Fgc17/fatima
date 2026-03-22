import { select } from "@inquirer/prompts";

export type Validator = "zod" | "custom";

export const askValidator = async (_language?: string) =>
	(await select({
		message: "Select a validator",
		choices: [
			{
				name: "zod",
				value: "zod",
			},
			{
				name: "I'll build my own validator",
				value: "custom",
				description: "It is pretty easy.",
			},
		],
	})) as string;
