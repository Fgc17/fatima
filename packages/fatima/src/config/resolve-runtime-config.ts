import type { RuntimeConfigInput } from "../api/types";
import type { FatimaDebugLogger } from "../lib/debug";
import { createRegistry } from "../plugins/registry";
import { loadConfig } from "./read-config";
import type { NormalizedFatimaConfig } from "./types";

export function hasConfigOverrides(options?: RuntimeConfigInput) {
	return Boolean(options?.environment || options?.publicPrefix);
}

function mergeRuntimeConfig(
	config: NormalizedFatimaConfig,
	options?: RuntimeConfigInput,
): NormalizedFatimaConfig {
	return {
		...config,
		environmentExpression: options?.environment
			? JSON.stringify(options.environment)
			: config.environmentExpression,
		publicPrefix: options?.publicPrefix ?? config.publicPrefix,
	};
}

export async function resolveRuntimeConfig(
	options?: RuntimeConfigInput,
	settings?: {
		requireConfig?: boolean;
		debug?: FatimaDebugLogger;
	},
) {
	const config = await loadConfig(options?.config, {
		debug: settings?.debug,
	});
	const mergedConfig = mergeRuntimeConfig(config, options);
	const registry = await createRegistry(
		mergedConfig.plugins,
		mergedConfig.configFile.folderPath,
	);

	return {
		config: mergedConfig,
		registry,
	};
}
