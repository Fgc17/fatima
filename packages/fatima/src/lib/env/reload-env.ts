import type { FatimaConfig } from "../config";
import { fatimaStore, logger } from "@fatimajs/tools/lib";
import { createClient } from "../client/create-client";
import { lifecycle } from "../lifecycle";
import { compareArrays } from "../utils/compare-arrays";
import { parseValidationErrors } from "../utils/parse-validation";
import { loadEnv } from "./load-env";

export const reloadEnv = async (config: FatimaConfig) => {
	const isClientGenerationEnabled = !fatimaStore.get("liteMode");

	const previousEnvNames = fatimaStore.get("envNames").split("#");

	const { env, envCount } = await loadEnv(config);

	const currentEnvNames = Object.keys(env).map((k) => k.toLowerCase());

	const didChangeEnv = !compareArrays(previousEnvNames, currentEnvNames);

	if (isClientGenerationEnabled && didChangeEnv) {
		createClient(config, env);
		logger.success(`Updated types with ${envCount} environment variables`);
	}

	if (config.validate) {
		const { errors } = await config.validate(env);

		if (errors?.length) {
			const parsedErrors = parseValidationErrors(errors);

			lifecycle.error.invalidEnvironmentVariables(parsedErrors, false);
		}
	}

	return { env, envCount };
};
