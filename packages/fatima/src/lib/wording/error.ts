import type { FatimaParsedValidationErrors } from "../types";

const missingEnvironmentVariable = (env: string) =>
	`Missing environment variable: ${env}`;

const missingConfig = (config: string) => `Missing configuration: ${config}`;

const missingEnvironmentConfig = () =>
	`No 'config.environment' found. Please set the environment config in your fatima.config.ts file.`;

const undefinedEnvironmentFunctionReturn = () =>
	`The 'config.environment' function returned undefined or "". Please return a filled string.`;

const environmentMixing = (initial: string, final: string) =>
	[
		`You tried to load "${initial}" variables, but ended up loading "${final}" variables, be careful.\n`,
		"The environment must be consistent, otherwise you risk loading secrets from the wrong environment (e.g prod -> dev).",
	].join("\n");

const invalidEnvironmentVariables = (
	parsedErrors: FatimaParsedValidationErrors,
) =>
	"Validation failed, here's the error list:" +
	"\n\n" +
	Object.entries(parsedErrors)
		?.map(([key, messages]) => `❌ ${key}\n  • ${messages.join("\n  • ")}`)
		.join("\n");

const missingBabelTransformClassProperties = () =>
	"You need to install '@babel/plugin-transform-class-properties' to use 'class-validator' with Fatima.";

const missinJitiModule = () =>
	[
		"You need to install 'jiti' as a dev dependency to use typescript config with Fatima.",
		'Run: "pnpm i -D jiti", "yarn add -D jiti", "npm i -D jiti"',
	].join("\n");

const missingWatchPort = () =>
	"You need to set 'config.reload.watch' to use the watch feature.";

const heavenPortAlreadyInUse = (port: number | string) =>
	[
		`Couldn't run Heaven, port ${port} is already in use.`,
		`Please specify a different one under config option 'heaven' or kill the current process.`,
	].join("\n");

const undefinedEnvironment = (key: string) =>
	`Environment variable ${key} not found.`;

const undefinedEnvironmentAndStore = (key: string) => [
	`Environment variable ${key} not found.`,
	"You might have forgotten to run: fatima dev -g -- 'your-command'",
];

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
