import { logger } from "lib/logger";
import { parseValidationErrors } from "lib/utils/parse-validation";
import { wording } from "lib/wording";
import { action } from "../context/action";
import { type EnvActionContext, envActionContext } from "../context/env";

export const validateService = async ({
	env,
	config: { schema },
}: EnvActionContext) => {
	if (!schema) {
		throw new Error("No schema defined in the configuration for validation.");
	}

	const { isValid, errors } = await schema.validate(env);

	if (!isValid && errors) {
		const parsedErrors = parseValidationErrors(errors);

		throw new Error(wording.error.invalidEnvironmentVariables(parsedErrors));
	}

	logger.success("Successfully validated environment variables");
};

export const validateAction = action(validateService, envActionContext);
