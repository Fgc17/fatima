import { select } from "@inquirer/prompts";
import type { Adapter } from "../../types";

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
