import { logger } from "../lib";

const missingHeavenPort = () => {
	logger.error("You need to set 'config.heaven' to use the watch feature.");

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
	missingHeavenPort,
	undefinedEnvironment,
	undefinedEnvironmentAndStore,
};
