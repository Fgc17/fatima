import { resolveRuntimeConfig } from "../config/resolve-runtime-config";
import { loadEnvironment } from "../env/load-env";
import { populateEnv } from "../env/process-env";
import { createDebugLogger } from "../lib/debug";
import { createLog } from "../lib/log";
import { providers } from "../providers";
import type { RuntimeConfigInput } from "./types";

export type { RuntimeConfigInput } from "./types";

export const register = (...files: string[]) => {
	const env = providers.local(files).fetch();

	if (env instanceof Promise) {
		throw new Error("register() only supports synchronous providers.");
	}

	populateEnv(env);

	return env;
};

export async function registerAsync(options?: RuntimeConfigInput) {
	const debug = createDebugLogger(options?.debug);
	const log = createLog(options?.log);

	debug.debug("registerAsync:start", "Loading environment into process.env", {
		hasConfigOverride: Boolean(options?.config),
		hasEnvironmentOverride: Boolean(options?.environment),
		processEnv: Boolean(options?.processEnv),
	});

	const { config, usedFallback } = await resolveRuntimeConfig(options, {
		debug,
	});

	const result = await loadEnvironment(config, {
		environment: options?.environment,
		useProcessEnv: options?.processEnv,
		debug,
	});

	debug.debug("registerAsync:populate", "Populating process.env", {
		variableCount: Object.keys(result.env).length,
		usedFallback,
	});
	populateEnv(result.env);
	debug.debug("registerAsync:done", "Environment loaded into process.env", {
		environment: result.environment,
		providersUsed: result.providersUsed,
		loadedVariableCount: Object.keys(result.loadedEnv).length,
	});
	log.info(
		`Loaded ${Object.keys(result.loadedEnv).length} vars for ${result.environment}.`,
	);
	log.dim("Injected resolved environment into process.env");

	return result;
}
