import { generateClient } from "lib/client/generate";
import { logger } from "lib/logger";
import { action } from "../context/action";
import { type EnvActionContext, envActionContext } from "../context/env";
import { validateService } from "./validate";

export const generateService = async (ctx: EnvActionContext) => {
	const { env, config } = ctx;

	if (config.validate) {
		await validateService(ctx);
	}

	await generateClient(config, env);

	logger.success("Successfully generated env.ts");
};

export const generateAction = action(generateService, envActionContext);
