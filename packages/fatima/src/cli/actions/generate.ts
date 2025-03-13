import { createAction, type ActionContext } from "../utils/create-action";
import { generateClient } from "lib/client/generate-client";
import { validateService } from "./validate";
import { logger } from "lib/logger";

export const generateService = async (ctx: ActionContext) => {
	const { env, config, envCount } = ctx;

	if (config.validate) {
		await validateService(ctx);
	}

	await generateClient(config, env);

	logger.success(
		`Successfully generated env.ts with ${envCount} environment variables`,
	);
};

export const generateAction = createAction(generateService);
