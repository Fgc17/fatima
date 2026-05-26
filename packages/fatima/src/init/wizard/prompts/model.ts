import { select } from "@inquirer/prompts";
import type { ModelPreset } from "../../types";

export const askModelPreset = async () =>
	(await select({
		message: "Select a model preset",
		choices: [
			{
				name: "Built-in models",
				value: "builtin",
			},
			{
				name: "I'll build my own model",
				value: "custom",
				description: "It is pretty easy.",
			},
		],
	})) as ModelPreset;
