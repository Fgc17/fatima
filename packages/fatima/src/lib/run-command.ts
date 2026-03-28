import { spawn } from "node:child_process";
import type { UnsafeEnvironmentVariables } from "../config/types";
import type { FatimaDebugLogger } from "./debug";

export function runCommand(
	command: string[],
	options: {
		debug?: FatimaDebugLogger;
		env?: NodeJS.ProcessEnv | UnsafeEnvironmentVariables;
		stdio?: "ignore" | "inherit";
	} = {},
): Promise<number> {
	const [bin, ...args] = command;
	options.debug?.debug("run:spawn", "Spawning child process", {
		bin,
		argCount: args.length,
		stdio: options.stdio ?? "inherit",
	});

	return new Promise((resolve, reject) => {
		const child = spawn(bin, args, {
			env: options.env,
			stdio: options.stdio ?? "inherit",
			shell: false,
		});

		child.once("error", (error) => {
			options.debug?.debug("run:error", "Child process failed to start", {
				bin,
				error: error.message,
			});
			reject(error);
		});
		child.once("close", (code) => {
			options.debug?.debug("run:close", "Child process exited", {
				bin,
				exitCode: code ?? 0,
			});
			resolve(code ?? 0);
		});
	});
}
