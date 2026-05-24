import { existsSync } from "node:fs";
import { parse, resolve } from "node:path";
import { FatimaError } from "../lib/error";

export function resolveConfigPath(configPath?: string): string {
	const baseDir = process.cwd();
	const resolvedPath = resolve(baseDir, configPath ?? "fatima.json");

	if (configPath) {
		const parsed = parse(configPath);

		if (!parsed.ext) {
			throw new FatimaError(
				`No extension found in given config file path: ${configPath}`,
			);
		}

		if (parsed.ext !== ".json") {
			throw new FatimaError(`Invalid given config file extension: ${parsed.ext}`);
		}
	}

	if (!existsSync(resolvedPath)) {
		throw new FatimaError(
			`Config file not found: ${resolvedPath}\n\nCreate a fatima.json file in your project root.`,
		);
	}

	return resolvedPath;
}
