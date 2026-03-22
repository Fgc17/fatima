import { spawn } from "node:child_process";
import type { UnsafeEnvironmentVariables } from "../types";

export function runCommand(
	command: string[],
	options: {
		env?: NodeJS.ProcessEnv | UnsafeEnvironmentVariables;
		stdio?: "ignore" | "inherit";
	} = {},
): Promise<number> {
	const [bin, ...args] = command;

	return new Promise((resolve, reject) => {
		const child = spawn(bin, args, {
			env: options.env,
			stdio: options.stdio ?? "inherit",
			shell: false,
		});

		child.once("error", reject);
		child.once("close", (code) => resolve(code ?? 0));
	});
}
