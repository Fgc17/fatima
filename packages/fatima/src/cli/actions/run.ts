import { createInjectableEnv } from "lib/env/patch-env";
import { exec } from "lib/exec";
import { logger } from "lib/logger";
import { action } from "../context/action";
import { type EnvActionContext, envActionContext } from "../context/env";

export const runService = async ({ env, envCount, args }: EnvActionContext) => {
	const injectableEnv = createInjectableEnv(env);

	logger.success(`Loaded ${envCount} environment variables`);

	const child = exec(args, {
		env: injectableEnv,
		shell: true,
	});

	child.on("error", (error) => {
		throw new Error("Something went wrong", {
			cause: error,
		});
	});

	child.on("close", (code) => {
		if (code !== 0) {
			process.exit(code);
		}
	});
};

export const runAction = action(runService, envActionContext);
