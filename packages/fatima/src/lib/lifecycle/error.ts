import { logger } from "lib/logger";
import type { FatimaParsedValidationErrors } from "../types";

const missingEnvironmentVariable = (env: string): never => {
	logger.error(`Missing environment variable: ${env}`);

	console.log("");

	process.exit(1);
};

const missingConfig = (config: string): never => {
	logger.error(`Missing configuration: ${config}`);

	console.log("");

	process.exit(1);
};

const missingEnvironmentConfig = () => {
	logger.error(
		`No 'config.environment' found. Please set the environment config in your fatima.config.ts file.`,
	);

	console.log("");

	process.exit(1);
};

const undefinedEnvironmentFunctionReturn = () => {
	logger.error(
		`The 'config.environment' function returned undefined or "". Please return a filled string.`,
	);

	console.log("");

	process.exit(1);
};

const environmentMixing = (initial: string, final: string) => {
	logger.error(
		`You tried to load "${initial}" variables, but ended up loading "${final}" variables, be careful.\n`,
		"The environment must be consistent, otherwise you risk loading secrets from the wrong environment (e.g prod -> dev).",
	);

	console.log("");

	process.exit(1);
};

const invalidEnvironmentVariables = (
	parsedErrors: FatimaParsedValidationErrors,
	exit = true,
) => {
	logger.error(
		"Validation failed, here's the error list:" +
			"\n\n" +
			Object.entries(parsedErrors)
				?.map(([key, messages]) => `❌ ${key}\n  • ${messages.join("\n  • ")}`)
				.join("\n"),
	);

	console.log("");

	if (exit) {
		process.exit(1);
	}
};

const missingBabelTransformClassProperties = () => {
	logger.error(
		"You need to install '@babel/plugin-transform-class-properties' to use 'class-validator' with Fatima.",
	);

	console.log("");

	process.exit(1);
};

const missinJitiModule = () => {
	logger.error(
		"You need to install 'jiti' as a dev dependency to use typescript config with Fatima.",
		'Run: "pnpm i -D jiti", "yarn add -D jiti", "npm i -D jiti"',
	);

	console.log("");

	process.exit(1);
};

const missingWatchPort = () => {
	logger.error(
		"You need to set 'config.reload.watch' to use the watch feature.",
	);

	console.log("");

	process.exit(1);
};

const heavenPortAlreadyInUse = (port: number | string) => {
	logger.error(
		`Couldn't run Heaven, port ${port} is already in use.`,
		`Please specify a different one under config option 'heaven' or kill the current process.`,
	);

	console.log("");

	process.exit(1);
};

const undefinedEnvironment = (key: string) => {
	logger.error(`Environment variable ${key} not found.`);

	process.exit(1);
};

const undefinedEnvironmentAndStore = (key: string) => {
	logger.error(
		`Environment variable ${key} not found.`,
		"You might have forgotten to run: fatima dev -g -- 'your-command'",
	);

	process.exit(1);
};

export const error = {
	missingConfig,
	missingEnvironmentConfig,
	missingEnvironmentVariable,
	environmentMixing,
	invalidEnvironmentVariables,
	missingBabelTransformClassProperties,
	missinJitiModule,
	missingWatchPort,
	heavenPortAlreadyInUse,
	undefinedEnvironmentFunctionReturn,
	undefinedEnvironment,
	undefinedEnvironmentAndStore,
};
