import { spawn } from "node:child_process";
import { createAction, type ActionContext } from "../utils/create-action";
import { createInjectableEnv } from "@fatimajs/tools/lib";

export const runService = async ({ env, args }: ActionContext) => {
	const cmd = args.shift();

	const injectableEnv = createInjectableEnv(env);

	const child = spawn(cmd as string, [...args], {
		env: injectableEnv,
		shell: true,
		stdio: "inherit",
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

export const runAction = createAction(runService);
