import { existsSync, readFileSync } from "node:fs";
import { isTypescriptFile } from "../lib/is-typescript";

export const getConfigLanguage = (configPath: string) => {
	const lang = isTypescriptFile(configPath) ? "ts" : "js";

	if (!existsSync(configPath)) {
		return {
			lang,
			module: "esm",
		} as const;
	}

	const configContent = readFileSync(configPath, "utf-8");

	const isCJS =
		configContent.includes("exports.") ||
		configContent.includes("module.exports");

	return {
		lang,
		module: isCJS ? "cjs" : "esm",
	} as const;
};
