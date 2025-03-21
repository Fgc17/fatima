import { select } from "@inquirer/prompts";

export type Adapter =
	| "dotenv"
	| "infisical"
	| "vercel"
	| "triggerdev"
	| "heroku"
	| "custom";

export const askAdapter = async () =>
	(await select({
		message: "Select an adapter",
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
				name: "trigger.dev",
				value: "triggerdev",
			},
			{
				name: "I'll build my own adapter",
				value: "custom",
				description: "It is pretty easy.",
			},
		],
	})) as Adapter;
