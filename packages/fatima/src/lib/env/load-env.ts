import type { FatimaConfig } from "core/config";
import { logger } from "lib/logger";
import { fatimaStore } from "lib/store";
import type { FatimaLoadFunction, UnsafeEnvironmentVariables } from "lib/types";
import { wording } from "../wording";

export async function loadEnv(config: FatimaConfig) {
	try {
		const initialSecretsEnviornment = fatimaStore.get("environment");

		if (!initialSecretsEnviornment || initialSecretsEnviornment === "") {
			throw new Error(wording.error.undefinedEnvironmentFunctionReturn());
		}

		const load = config.load[initialSecretsEnviornment];

		if (fatimaStore.get("skipLoading") || !load) {
			if (!load) {
				logger.warn(
					`No environment loading function found for the environment "${initialSecretsEnviornment}"`,
				);
			}

			logger.info(
				"Skipping environment loading, loading system process.env object.",
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

		const finalSecretsEnvironment = config.environment(
			process.env as UnsafeEnvironmentVariables,
		);

		if (finalSecretsEnvironment !== initialSecretsEnviornment) {
			throw new Error(
				wording.error.environmentMixing(
					initialSecretsEnviornment,
					finalSecretsEnvironment,
				),
			);
		}

		fatimaStore.set("envNames", Object.keys(env));

		return {
			env,
			envCount: Object.keys(env).length,
		};
	} catch (err) {
		throw new Error(`Failed to load environment variables: ${err.message}`, {
			cause: err,
		});
	}
}
