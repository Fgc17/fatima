// @ts-nocheck

// eslint-disable-next-line @fatima/no-process-env
const processEnv = process.env;

const createLogLine = (message) => {
	const env =
		processEnv.fatima_environment?.split(":")[1] ?? "EnvironmentNotFound";

	return `🔒 [fatima] (${env}) ` + message.join("\n");
};

const logError = (...messages) => {
	const message = createLogLine(messages);

	const currentLogCount = Number(processEnv.fatima_logs?.split(2) ?? "0");

	processEnv.fatima_logs = "i:" + (currentLogCount + 1).toString();

	console.log(`\u001B[31m ${message} \u001B[39m`);
};

const undefinedEnvironment = (key) => {
	logError(`Environment variable ${key} not found.`);
	process.exit(1);
};

const undefinedEnvironmentAndStore = (key) => {
	logError(
		`Environment variable ${key} not found.`,
		"You might have forgotten to run: fatima dev -g -- 'your-command'",
	);
	process.exit(1);
};

const createEnv = (options) => {
	const isServer = options.isServer || (() => typeof window === "undefined");

	/** @returns {boolean} */
	const isAccessForbidden = () => !isServer();

	/** @param {string} key @returns {boolean} */
	const isUndefined = (key) => !processEnv[key];

	/** @param {string} key */
	const handleUndefined = (key) => {
		if (!processEnv.fatima_storeMarker) {
			return undefinedEnvironmentAndStore(key);
		}
		return undefinedEnvironment(key);
	};

	/** @param {string} key */
	const handleForbiddenAccess = (key) => {
		const error = [
			"Here are some possible fixes:",
			"\n 1. Add the public prefix to your variable if you want to expose it to the client.",
			"\n 2. Check if your public prefix is correct by assigning 'env.publicPrefix' to your fatima configuration.",
		];

		logError(...error);

		throw new Error(
			`🔒 [fatima] Environment variable ${key} not allowed on the client.` +
				error.join("\n"),
		);
	};

	const fatimaEnv = new Proxy(processEnv, {
		/** @param {Object} target @param {string} key @returns {string} */
		get(target, key) {
			if (isAccessForbidden()) {
				handleForbiddenAccess(key);
			}

			if (isUndefined(key)) {
				handleUndefined(key);
			}

			return Reflect.get(target, key);
		},
	});

	return fatimaEnv;
};

const createPublicEnv = (options) => {
	/** @param {string} key @returns {boolean} */
	const isUndefined = (key) => {
		if (!options.publicVariables[key]) {
			return true;
		}
	};

	/** @param {string} key */
	const handleUndefined = (key) => {
		throw new Error(`🔒 [fatima] Environment variable ${key} not found.`);
	};

	const fatimaPublicEnv = new Proxy(options.publicVariables, {
		/** @param {Object} target @param {string} key @returns {string} */
		get(target, key) {
			if (isUndefined(key)) {
				handleUndefined(key);
			}

			return Reflect.get(target, key);
		},
	});

	return fatimaPublicEnv;
};
