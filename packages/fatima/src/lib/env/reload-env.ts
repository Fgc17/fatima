import type { FatimaConfig } from "src/core/config";
import { lifecycle } from "src/core/lifecycle";
import { loadEnv } from "src/lib/env/load-env";
import { createClient } from "src/lib/client/generate-client";
import { parseValidationErrors } from "src/lib/utils/parse-validation";
import { fatimaStore } from "src/lib/store/store";
import { logger } from "src/lib/logger/logger";
import { compareArrays } from "src/lib/utils/compareArrays";

export const reloadEnv = async (config: FatimaConfig) => {
	const isClientGenerationEnabled = !fatimaStore.get("fatimaLiteMode");

	const previousEnvNames = fatimaStore.get("fatimaEnvNames").split("#");

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
