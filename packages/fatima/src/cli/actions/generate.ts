import { createAction, type ActionContext } from "../utils/create-action";
import { createClient } from "lib/client/create-client";
import { validateService } from "./validate";
import { logger } from "@fatimajs/tools/lib";

export const generateService = async (ctx: ActionContext) => {
	const { env, config, envCount } = ctx;

	if (config.validate) {
		await validateService(ctx);
	}

	createClient(config, env);

	logger.success(
		`Successfully generated env.ts with ${envCount} environment variables`,
	);
};

export const generateAction = createAction(generateService);
