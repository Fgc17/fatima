import { existsSync } from "node:fs";
import { parse, resolve } from "node:path";
import { FatimaError } from "../lib/error";

export function missingConfigMessage(configPath: string): string {
	return `Config file not found: ${configPath}\n\nFatima requires a fatima.json file. Run \`fatima init\` in your project root before using Fatima.`;
}

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
			throw new FatimaError(
				`Invalid given config file extension: ${parsed.ext}`,
			);
		}
	}

	if (!existsSync(resolvedPath)) {
		throw new FatimaError(missingConfigMessage(resolvedPath));
	}

	return resolvedPath;
}
