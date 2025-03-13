import type { FatimaConfig } from "../config";
import { generateClient } from "../client/generate-client";
import { lifecycle } from "../lifecycle";
import { compareArrays } from "../utils/compare-arrays";
import { parseValidationErrors } from "../utils/parse-validation";
import { loadEnv } from "./load-env";
import { logger } from "lib/logger";
import { fatimaStore } from "lib/store";

export const reloadEnv = async (config: FatimaConfig) => {
	const isClientGenerationEnabled = !fatimaStore.get("liteMode");

	const previousEnvNames = fatimaStore.get("envNames");

	const { env, envCount } = await loadEnv(config);

	const currentEnvNames = Object.keys(env);

	const didChangeEnv = !compareArrays(previousEnvNames, currentEnvNames);

	if (isClientGenerationEnabled && didChangeEnv) {
		await generateClient(config, env);
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
