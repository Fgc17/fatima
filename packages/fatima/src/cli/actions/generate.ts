import { generateClient } from "lib/client/generate";
import { logger } from "lib/logger";
import { action } from "../context/action";
import { type EnvActionContext, envActionContext } from "../context/env";
import { validateService } from "./validate";
import { fatimaStore } from "lib/store";

export const generateService = async (ctx: EnvActionContext) => {
	const { env, config } = ctx;

	if (fatimaStore.get("strictMode") && ctx.config.schema) {
		await validateService(ctx);
	}

	await generateClient(config, env);

	logger.success("Successfully generated env.ts");
};

export const generateAction = action(generateService, envActionContext);
