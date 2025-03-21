import { select } from "@inquirer/prompts";

export const askPublic = async () =>
	await select({
		message: "Do you want to set up public secrets? (usually for frontend)",
		choices: [
			{
				name: "No",
				value: "no-public",
			},
			{
				name: "Yes",
				value: "public",
			},
		],
	});
