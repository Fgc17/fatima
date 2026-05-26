import fs from "node:fs/promises";
import type { ScaffoldPlan } from "./presets";

export async function renderConfigFile(plan: ScaffoldPlan): Promise<string> {
	return `${JSON.stringify(plan.config, null, "\t")}\n`;
}

export async function writeConfigFile(plan: ScaffoldPlan): Promise<void> {
	const content = await renderConfigFile(plan);

	await fs.writeFile(plan.outputFile, content);

	await Promise.all(
		Object.entries(plan.files).map(([filePath, fileContent]) =>
			fs.writeFile(filePath, `${fileContent}\n`),
		),
	);
}
