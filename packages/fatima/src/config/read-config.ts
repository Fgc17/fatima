import fs from "node:fs";
import type { FatimaDebugLogger } from "../lib/debug";
import { FatimaError } from "../lib/error";
import type { FatimaJsonConfig } from "./json-types";
import { normalizeJsonConfig } from "./normalize-json-config";
import { missingConfigMessage, resolveConfigPath } from "./resolve-config-path";
import type { NormalizedFatimaConfig } from "./types";

function parseConfigFile(
	configPath: string,
	debug?: FatimaDebugLogger,
): FatimaJsonConfig {
	if (!fs.existsSync(configPath)) {
		throw new FatimaError(missingConfigMessage(configPath));
	}

	debug?.debug("config:read", "Reading fatima.json", {
		configPath,
	});

	try {
		return JSON.parse(fs.readFileSync(configPath, "utf8")) as FatimaJsonConfig;
	} catch (error) {
		throw new FatimaError(`Invalid JSON config file at ${configPath}.`, {
			cause: error,
		});
	}
}

export async function loadConfig(
	configPath?: string,
	options?: { debug?: FatimaDebugLogger },
): Promise<NormalizedFatimaConfig> {
	const resolvedPath = resolveConfigPath(configPath);
	options?.debug?.debug("config:resolve", "Resolved config path", {
		configPath: resolvedPath,
	});
	process.env.FATIMA_CONFIG_PATH = resolvedPath;
	const loaded = parseConfigFile(resolvedPath, options?.debug);
	const normalized = normalizeJsonConfig(loaded, resolvedPath);

	options?.debug?.debug("config:loaded", "Config module loaded successfully", {
		configPath: resolvedPath,
	});

	return normalized;
}

export const readConfig = loadConfig;
