import { type Interfaces, run } from "@oclif/core";
import packageJson from "../../package.json";
import Format from "../cli/commands/format";
import Generate from "../cli/commands/generate";
import Init from "../cli/commands/init";
import Keygen from "../cli/commands/keygen";
import Run from "../cli/commands/run";
import Secrets from "../cli/commands/secrets";
import Validate from "../cli/commands/validate";
import Vault from "../cli/commands/vault";
import { formatError, hasDebugFlag, isSilentExitError } from "../cli/errors";

const KNOWN_COMMANDS = new Set([
	"format",
	"generate",
	"init",
	"keygen",
	"run",
	"secrets",
	"validate",
	"vault",
]);
const PASSTHROUGH_TOKENS = new Set(["--help", "-h", "--version", "-v", "help"]);

function normalizeArgv(argv: string[]): string[] {
	const separatorIndex = argv.indexOf("--");

	if (separatorIndex === 0) {
		return ["run", "--", ...argv.slice(1)];
	}

	if (separatorIndex > 0) {
		const leadingFlags = argv.slice(0, separatorIndex);
		return ["run", ...leadingFlags, "--", ...argv.slice(separatorIndex + 1)];
	}

	let commandIndex = -1;

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];

		if (token === "--") {
			break;
		}

		if (!token.startsWith("-")) {
			commandIndex = index;
			break;
		}
	}

	if (commandIndex === -1) {
		return argv.length === 0 ? ["run"] : argv;
	}

	const command = argv[commandIndex];

	if (KNOWN_COMMANDS.has(command) || PASSTHROUGH_TOKENS.has(command)) {
		return argv;
	}

	const leadingFlags = argv.slice(0, commandIndex);
	const commandArgs = argv.slice(commandIndex);

	if (leadingFlags.length === 0) {
		return ["run", "--", ...commandArgs];
	}

	return ["run", ...leadingFlags, "--", ...commandArgs];
}

export const COMMANDS = {
	format: Format,
	generate: Generate,
	init: Init,
	keygen: Keygen,
	run: Run,
	secrets: Secrets,
	validate: Validate,
	vault: Vault,
};

const oclifPackageJson = {
	...packageJson,
	oclif: {
		...packageJson.oclif,
		commands: {
			...packageJson.oclif.commands,
			target: "./cli.js",
		},
	},
} as Interfaces.PJSON;

const argv = process.argv.slice(2);

const execution = run(normalizeArgv(argv), {
	root: import.meta.dirname,
	pjson: oclifPackageJson,
});

execution.catch((error: unknown) => {
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
