import { resolve, parse } from "node:path";
import { existsSync, readdirSync, statSync } from "node:fs";
import { logger } from "lib/logger";

const searchBlacklist = [
	"node_modules",
	".git",
	"dist",
	"out",
	"build",
	".next",
	".nuxt",
	".cache",
	".tmp",
	".temp",
	".vscode",
	"logs",
];

export function resolveConfigPath(configPath?: string): string {
	const baseDir = process.cwd();
	const extensions = [".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"];

	if (configPath) {
		const parsed = parse(configPath);

		if (!extensions.includes(parsed.ext)) {
			logger.error(`Invalid given config file extension: ${parsed.ext}`);
			process.exit(1);
		}

		const fullPath = resolve(baseDir, configPath);

		if (!existsSync(fullPath)) {
			logger.error(`Config file doesn't exist: ${fullPath}`);
			process.exit(1);
		}

		return fullPath;
	}

	const baseName = "env.config";

	function searchConfig(dir: string): string | null {
		const foundPaths: string[] = [];

		for (const file of readdirSync(dir)) {
			const fullPath = resolve(dir, file);

			const workspacePath = fullPath.replace(baseDir, "");

			const pathCrumbs = workspacePath.split("/").map((c) => c.trim());

			if (
				searchBlacklist.some((blacklisted) => pathCrumbs.includes(blacklisted))
			) {
				continue;
			}

			if (extensions.some((ext) => file === baseName + ext)) {
				foundPaths.push(fullPath);
			}

			if (statSync(fullPath).isDirectory()) {
				const nestedConfig = searchConfig(fullPath);
				if (nestedConfig) foundPaths.push(nestedConfig);
			}
		}

		return foundPaths[0] || null;
	}

	const configPathFound = searchConfig(baseDir);

	if (!configPathFound) {
		logger.error(
			"No 'env.config.{js|ts|etc}' file found in the current directory or its subdirectories.",
		);
		process.exit(1);
	}

	return configPathFound;
}
