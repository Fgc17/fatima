import { exec } from "lib/exec";
import { createInjectableEnv } from "lib/env/patch-env";
import { createAction } from "../utils/create-action";
import { type EnvActionContext, envActionContext } from "../context/env";

export const runService = async ({ env, args }: EnvActionContext) => {
	const injectableEnv = createInjectableEnv(env);

	const child = exec(args, {
		env: injectableEnv,
		shell: true,
	});

	child.on("error", (error) => {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	});

	child.on("close", (code) => {
		if (code !== 0) {
			console.error(`Command exited with code ${code}`);
			process.exit(code);
		}
	});
};

export const runAction = createAction(runService, envActionContext);
