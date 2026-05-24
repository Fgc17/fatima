import { select } from "@inquirer/prompts";

export type Validator = "builtin" | "custom";

export const askValidator = async (_generator?: string) =>
	(await select({
		message: "Select a validator",
		choices: [
			{
				name: "Built-in validators",
				value: "builtin",
			},
			{
				name: "I'll build my own validator",
				value: "custom",
				description: "It is pretty easy.",
			},
		],
	})) as string;
