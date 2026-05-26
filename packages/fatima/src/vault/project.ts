import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { missingConfigMessage } from "../config/resolve-config-path";
import { FatimaError } from "../lib/error";
import type {
	LocalVaultStoreInput,
	LocalVaultStoreOptions,
	ProjectSecretManagerSettings,
	StoredProjectConfig,
} from "./types";

const DEFAULT_ENVIRONMENTS = ["development", "staging", "production"];
const DEFAULT_STORE_PATH = ".fatima";

function normalizeEnvironments(environments?: string[]): string[] {
	const values = environments?.filter((value) => value.length > 0) ?? [];
	const seen = new Set<string>();
	const normalized: string[] = [];

	for (const value of values) {
		if (!seen.has(value)) {
			seen.add(value);
			normalized.push(value);
		}
	}

	return normalized.length > 0 ? normalized : DEFAULT_ENVIRONMENTS;
}

function normalizeStoreInput(
	input?: LocalVaultStoreInput,
): LocalVaultStoreOptions {
	return typeof input === "string" ? { config: input } : (input ?? {});
}

export function resolveProjectConfigPath(
	configPath?: string,
	cwd = process.cwd(),
): string | null {
	const resolvedPath = path.resolve(cwd, configPath ?? "fatima.json");
	return existsSync(resolvedPath) ? resolvedPath : null;
}

function requireProjectConfigPath(
	configPath?: string,
	cwd = process.cwd(),
): string {
	const resolvedPath = path.resolve(cwd, configPath ?? "fatima.json");

	if (!existsSync(resolvedPath)) {
		throw new FatimaError(missingConfigMessage(resolvedPath));
	}

	return resolvedPath;
}

export function resolveProjectSecretManagerSettings(
	input?: LocalVaultStoreInput,
): ProjectSecretManagerSettings {
	const options = normalizeStoreInput(input);
	const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
	const storePath = path.resolve(cwd, options.storePath ?? DEFAULT_STORE_PATH);
	const storeConfigPath = path.join(storePath, "config.json");

	if (options.storePath && existsSync(storeConfigPath)) {
		try {
			const storedConfig = JSON.parse(
				readFileSync(storeConfigPath, "utf8"),
			) as StoredProjectConfig;
			return {
				defaultEnvironment: storedConfig.defaultEnvironment,
				environments: normalizeEnvironments(storedConfig.environments),
				storePath,
			};
		} catch (error) {
			throw new FatimaError(
				`Invalid vault config file at ${storeConfigPath}.`,
				{
					cause: error,
				},
			);
		}
	}

	if (options.storePath) {
		return {
			defaultEnvironment: DEFAULT_ENVIRONMENTS[0] ?? "development",
			environments: DEFAULT_ENVIRONMENTS,
			storePath,
		};
	}

	const existingConfigPath = requireProjectConfigPath(options.config, cwd);

	try {
		JSON.parse(readFileSync(existingConfigPath, "utf8"));
	} catch (error) {
		throw new FatimaError(
			`Invalid JSON config file at ${existingConfigPath}.`,
			{
				cause: error,
			},
		);
	}

	const configFolder = path.dirname(existingConfigPath);
	const configStorePath = path.resolve(configFolder, DEFAULT_STORE_PATH);
	const configStoreConfigPath = path.join(configStorePath, "config.json");

	if (existsSync(configStoreConfigPath)) {
		try {
			const storedConfig = JSON.parse(
				readFileSync(configStoreConfigPath, "utf8"),
			) as StoredProjectConfig;
			return {
				defaultEnvironment: storedConfig.defaultEnvironment,
				environments: normalizeEnvironments(storedConfig.environments),
				storePath: configStorePath,
			};
		} catch (error) {
			throw new FatimaError(
				`Invalid vault config file at ${configStoreConfigPath}.`,
				{
					cause: error,
				},
			);
		}
	}

	const environments = DEFAULT_ENVIRONMENTS;
	const defaultEnvironment = environments[0] ?? "development";

	return {
		defaultEnvironment,
		environments,
		storePath: configStorePath,
	};
}

export const DEFAULT_SECRET_MANAGER_ENVIRONMENTS = DEFAULT_ENVIRONMENTS;
