import { run } from "@oclif/core";
import Generate from "./commands/generate";
import Run from "./commands/run";
import Validate from "./commands/validate";
import { formatError, hasDebugFlag, isSilentExitError } from "./lib/errors";

export const COMMANDS = {
	generate: Generate,
	run: Run,
	validate: Validate,
};

run(process.argv.slice(2), import.meta.url).catch((error: unknown) => {
	if (isSilentExitError(error)) {
		process.exitCode = 0;
		return;
	}

	const debug = hasDebugFlag(process.argv.slice(2));
	const { message, details, exitCode } = formatError(error, { debug });
	const output = details.length ? [message, ...details].join("\n") : message;

	process.stderr.write(`${output}\n`);
	process.exitCode = exitCode;
});
