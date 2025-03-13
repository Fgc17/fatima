import { spawn } from "node:child_process";
import { createAction, type ActionContext } from "../utils/create-action";
import { generateClient } from "lib/client/generate-client";
import { createHeaven } from "lib/env/create-heaven";
import { createInjectableEnv } from "lib/env/patch-env";
import { logger } from "lib/logger";
import { fatimaStore } from "lib/store";

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
}: ActionContext) => {
	fatimaStore.set("devMode", true);

	const environment = fatimaStore.get("environment") as string;

	if (environmentBlacklist.includes(environment)) {
		logger.error(
			`Your 'config.environment()' function returned '${environment}', you can't run 'fatima dev' in this environment.`,
		);
		process.exit(1);
	}

	if (!fatimaStore.get("liteMode")) {
		await generateClient(config, env);
	}

	logger.success(`Loaded ${envCount} environment variables`);

	const injectableEnv = createInjectableEnv(env);

	const cmd = args.shift();

	const child = spawn(cmd as string, args, {
		env: injectableEnv,
		shell: false,
		stdio: ["inherit", "inherit", "inherit", "ipc"],
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

export const devAction = createAction(devService);
