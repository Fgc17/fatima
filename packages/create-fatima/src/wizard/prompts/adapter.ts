import { select } from "@inquirer/prompts";

export type Adapter = "local" | "infisical" | "vercel" | "custom";

export const askAdapter = async () =>
	(await select({
		message: "Select a provider",
		choices: [
			{
				name: "local (.env)",
				value: "local",
			},
			{
				name: "infisical",
				value: "infisical",
			},
			{
				name: "vercel",
				value: "vercel",
			},
			{
				name: "I'll build my own provider",
				value: "custom",
				description: "It is pretty easy.",
			},
		],
	})) as Adapter;
