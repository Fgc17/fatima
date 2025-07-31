// @ts-nocheck

const createLogLine = (message) => {
	const env =
		process.env.fatima_environment?.split(":")[1] ?? "EnvironmentNotFound";

	return `🔒 [fatima] (${env}) ` + message.join("\n");
};

const logError = (...messages) => {
	const message = createLogLine(messages);

	const currentLogCount = Number(process.env.fatima_logs?.split(2) ?? "0");

	process.env.fatima_logs = "i:" + (currentLogCount + 1).toString();

	console.log(`\u001B[31m ${message} \u001B[39m`);
};

const undefinedEnvironment = (key) => {
	const msg = `Environment variable ${key} not found.`;

	logError(msg);

	throw new Error(msg);
};

const undefinedEnvironmentAndStore = (key) => {
	const msg = `Environment variable ${key} not found.`;

	logError(
		msg,
		"You might have forgotten to run: fatima dev -- 'your-command'",
	);

	throw new Error(msg);
};

const createEnv = (options) => {
	const isServer = options.isServer || (() => typeof window === "undefined");

	const isAccessForbidden = () => !isServer();

	const handleForbiddenAccess = (key) => {
		const error = [
			`Environment variable ${key} not allowed on the client.`,
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

	const fatimaEnv = new Proxy(process.env, {
		get(target, key) {
			if (
				typeof key !== "string" ||
				key === "__esModule" ||
				key === "$$typeof"
			) {
				return undefined;
			}

			if (isAccessForbidden()) {
				handleForbiddenAccess(key);
			}

			return Reflect.get(target, key);
		},
	});

	return fatimaEnv;
};

const createPublicEnv = (publicVariables) => publicVariables;
