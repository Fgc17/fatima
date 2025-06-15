import { generateClient } from "lib/client/generate-client";
import { createHeaven } from "lib/env/create-heaven";
import { createInjectableEnv } from "lib/env/patch-env";
import { exec } from "lib/exec";
import { logger } from "lib/logger";
import { fatimaStore } from "lib/store";
import { action } from "../context/action";
import { type EnvActionContext, envActionContext } from "../context/env";

const environmentBlacklist = [
	"production",
	"prod",
	"staging",
	"stg",
	"preview",
	"pre",
	"prev",
	"preprod",
];

export const devService = async ({
	config,
	env,
	envCount,
	args,
}: EnvActionContext) => {
	fatimaStore.set("devMode", true);

	const environment = fatimaStore.get("environment") as string;

	if (environmentBlacklist.includes(environment)) {
		throw new Error(
			`Your 'config.environment()' function returned '${environment}', you can't run 'fatima dev' in this environment.`,
		);
	}

	if (!fatimaStore.get("liteMode")) {
		await generateClient(config, env);
	}

	logger.success(`Loaded ${envCount} environment variables`);

	const injectableEnv = createInjectableEnv(env);

	const child = exec(args, {
		env: injectableEnv,
		shell: false,
	});

	const { closeHeaven } = createHeaven(config);

	child.on("error", (error) => {
		console.error(`Error: ${error.message}`);
		closeHeaven();
		process.exit(1);
	});

	child.on("close", (code) => {
		if (code !== 0) {
			console.error(`Command exited with code ${code}`);
			closeHeaven();
			process.exit(code);
		}
	});
};

export const devAction = action(devService, envActionContext);
