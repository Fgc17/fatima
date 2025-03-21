import { select } from "@inquirer/prompts";
import { findNestedPackage } from "src/utils/has-nested-package";

export type UserIntent = "quit" | "continue";

export async function askUserIntent(): Promise<UserIntent> {
	const hasNestedPackage = findNestedPackage();

	if (!hasNestedPackage) return "continue";

	const willQuit = await select({
		message:
			"This will initialize fatima at your workspace root. Are you sure?",
		choices: [
			{
				name: "Yes, continue.",
				value: false,
			},
			{
				name: "Quit, I will run this at the package/app directory",
				value: true,
			},
		],
	});

	if (willQuit) return "quit";

	return "continue";
}
