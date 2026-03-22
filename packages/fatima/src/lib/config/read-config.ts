import fs from "node:fs";
import { getTsconfigAliases } from "@fatima/config/utils";
import { createJiti } from "jiti";
import type { FatimaConfig } from "../../core/config";
import { FatimaError } from "../errors";
import { isTypescriptFile } from "../utils/is-typescript";
import { resolveConfigPath } from "./resolve-config-path";
import { isFatimaConfig } from "./utils";

async function importConfigModule(configPath: string): Promise<unknown> {
	if (!fs.existsSync(configPath)) {
		throw new FatimaError(
			`Config file not found: ${configPath}\n\nCreate an env.config.ts file in your project root.`,
		);
	}

	if (!isTypescriptFile(configPath)) {
		const mod = await import(configPath);
		return (mod as { default?: unknown }).default ?? mod;
	}

	const jiti = createJiti(import.meta.url, {
		alias: (() => {
			try {
				return getTsconfigAliases(resolveConfigPath("tsconfig.json"));
			} catch {
				return {};
			}
		})(),
		interopDefault: true,
		fsCache: false,
	});

	return await jiti.import(configPath);
}

export async function loadConfig(configPath?: string): Promise<FatimaConfig> {
	const resolvedPath = resolveConfigPath(configPath);
	process.env.FATIMA_CONFIG_PATH = resolvedPath;
	const loaded = await importConfigModule(resolvedPath);

	if (!isFatimaConfig(loaded as FatimaConfig)) {
		throw new FatimaError(
			`Invalid config file at ${resolvedPath}. Export the result of config() from "fatima".`,
		);
	}

	return loaded as FatimaConfig;
}

export const readConfig = loadConfig;
