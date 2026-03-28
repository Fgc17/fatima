import fs from "node:fs";
import { getTsconfigAliases } from "@fatima/config/utils";
import { createJiti } from "jiti";
import type { FatimaDebugLogger } from "../lib/debug";
import { FatimaError } from "../lib/error";
import { isTypescriptFile } from "../lib/is-typescript";
import type { FatimaConfig } from ".";
import { resolveConfigPath } from "./resolve-config-path";

async function importConfigModule(
	configPath: string,
	debug?: FatimaDebugLogger,
): Promise<unknown> {
	if (!fs.existsSync(configPath)) {
		throw new FatimaError(
			`Config file not found: ${configPath}\n\nCreate an env.config.ts file in your project root.`,
		);
	}

	if (!isTypescriptFile(configPath)) {
		debug?.debug("config:import", "Importing JavaScript config module", {
			configPath,
		});
		const mod = await import(configPath);
		return (mod as { default?: unknown }).default ?? mod;
	}

	debug?.debug(
		"config:import",
		"Importing TypeScript config module with jiti",
		{
			configPath,
		},
	);

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

export function isMissingConfigError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);

	return (
		message.includes("No 'env.config.{js|ts|etc}' file found") ||
		message.includes("Config file doesn't exist:") ||
		message.includes("Config file not found:")
	);
}

function isFatimaConfig(config: unknown): config is FatimaConfig {
	if (!config || typeof config !== "object") {
		return false;
	}

	const candidate = config as Partial<FatimaConfig> & {
		file?: Partial<FatimaConfig["file"]>;
	};

	return Boolean(
		typeof candidate.environment === "function" &&
			candidate.providers &&
			typeof candidate.providers === "object" &&
			candidate.file &&
			typeof candidate.file === "object" &&
			typeof candidate.file.path === "string" &&
			typeof candidate.file.folderPath === "string" &&
			typeof candidate.file.extension === "string",
	);
}

export async function loadConfig(
	configPath?: string,
	options?: { debug?: FatimaDebugLogger },
): Promise<FatimaConfig> {
	const resolvedPath = resolveConfigPath(configPath);
	options?.debug?.debug("config:resolve", "Resolved config path", {
		configPath: resolvedPath,
	});
	process.env.FATIMA_CONFIG_PATH = resolvedPath;
	const loaded = await importConfigModule(resolvedPath, options?.debug);

	if (!isFatimaConfig(loaded)) {
		throw new FatimaError(
			`Invalid config file at ${resolvedPath}. Export the result of config() from "fatima".`,
		);
	}

	options?.debug?.debug("config:loaded", "Config module loaded successfully", {
		configPath: resolvedPath,
	});

	return loaded;
}

export const readConfig = loadConfig;
