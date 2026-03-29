import fs from "node:fs/promises";
import * as prettier from "prettier";
import type { ScaffoldPlan } from "./presets";

export async function renderConfigFile(plan: ScaffoldPlan): Promise<string> {
	const sections = [
		plan.imports.join("\n"),
		plan.helpers.join("\n"),
		[
			plan.language === "typescript"
				? "export default config({"
				: "module.exports = config({",
			plan.configFields.map((field) => `  ${field}`).join(",\n"),
			"});",
		].join("\n"),
	]
		.filter((section) => section.trim().length > 0)
		.join("\n\n");

	return prettier.format(sections, {
		parser: plan.language === "typescript" ? "typescript" : "babel",
		useTabs: true,
	});
}

export async function writeConfigFile(plan: ScaffoldPlan): Promise<void> {
	const content = await renderConfigFile(plan);

	await fs.writeFile(plan.outputFile, content);
}
