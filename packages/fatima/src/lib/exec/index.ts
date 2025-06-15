import { spawn } from "node:child_process";
import type { UnsafeEnvironmentVariables } from "lib/types";

export const exec = (
	command: string[],
	options: {
		env?: UnsafeEnvironmentVariables;
		shell?: boolean;
	},
) => {
	const [cmd, ...args] = command;

	return spawn(cmd, args, {
		env: options.env,
		shell: options.shell,
		stdio: "inherit",
	});
};
