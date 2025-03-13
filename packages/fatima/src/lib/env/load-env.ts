import type { FatimaConfig } from "lib/config";
import type { FatimaLoadFunction, UnsafeEnvironmentVariables } from "lib/types";
import { lifecycle } from "../lifecycle";
import { logger } from "lib/logger";
import { fatimaStore } from "lib/store";

export async function loadEnv(config: FatimaConfig) {
	try {
		const initialNodeEnv = fatimaStore.get("environment");

		if (!initialNodeEnv || initialNodeEnv === "") {
			return lifecycle.error.undefinedEnvironmentFunctionReturn();
		}

		const load = config.load[initialNodeEnv];

		if (!load) {
			logger.info(
				`No loader function found for the environment "${initialNodeEnv}", I will load the system process.env object (this is expected for production/staging environments).`,
			);

			return {
				env: process.env as UnsafeEnvironmentVariables,
				envCount: Object.keys(process.env).length,
			};
		}

		let loadChain = load as FatimaLoadFunction[];

		if (!load.length) {
			const loadFunction = load as FatimaLoadFunction;

			loadChain = [loadFunction];
		}

		let env = {} as UnsafeEnvironmentVariables;

		for (const load of loadChain) {
			const loadedEnvs = await load(process.env as UnsafeEnvironmentVariables);

			process.env = { ...process.env, ...loadedEnvs };

			env = { ...env, ...loadedEnvs };
		}

		const finalEnv = config.environment(
			process.env as UnsafeEnvironmentVariables,
		);

		if (finalEnv !== initialNodeEnv) {
			return lifecycle.error.environmentMixing(initialNodeEnv, finalEnv);
		}

		fatimaStore.set("envNames", Object.keys(env));

		return {
			env,
			envCount: Object.keys(env).length,
		};
	} catch (err) {
		logger.error(`Failed to load environment variables: ${err.message}`);
		process.exit(1);
	}
}
