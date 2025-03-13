// @ts-nocheck

export interface EnvObject {
	NODE_ENV: string;
	TZ: string;
	NEXT_PUBLIC_API_URL: string;
	TEST: string;
	PUBLIC_TEST: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */ // For ESLint
// biome-ignore lint/suspicious/noExplicitAny: For Biome
type AnyType = any;

export type FatimaEnvRecord<EnvObject, EnvValues = AnyType> = {
	[K in keyof EnvObject as K extends string ? K : never]: EnvValues;
};

export type FatimaPrimitiveEnvType<EnvObject> = {
	[K in keyof EnvObject as K extends string ? K : never]?: AnyType;
};

export type FatimaEnvType<
	EnvObject,
	Type extends
		FatimaPrimitiveEnvType<EnvObject> = FatimaPrimitiveEnvType<EnvObject>,
> = Type;

export type ServerEnvRecord<Keys extends PropertyKey, Prefix extends string> = {
	[K in Keys as K extends `${Prefix}${string}` ? never : K]: string;
};

export type PublicEnvRecord<Keys extends PropertyKey, Prefix extends string> = {
	[K in Keys as K extends `${Prefix}${string}` ? K : never]: string;
};

export type EnvKeys = keyof EnvObject;

export type EnvRecord<V = string> = FatimaEnvRecord<EnvObject, V>;

type PrimitiveEnvType = FatimaPrimitiveEnvType<EnvObject>;

export type EnvType<T extends PrimitiveEnvType> = FatimaEnvType<EnvObject, T>;

export type Env = ServerEnvRecord<EnvKeys, "PUBLIC_">;
export type PublicEnv = PublicEnvRecord<EnvKeys, "PUBLIC_">;

const colors = {
	error: [31, 39],
	success: [32, 39],
	warn: [33, 39],
	info: [34, 39],
};

const createLogLine = (message) => {
	const env = process.env.fatima_env ?? "EnvironmentNotFound";
	return `🔒 [fatima] (${env}) ` + message.join("\n");
};

const logError = (...messages) => {
	const [open, close] = colors.error;
	const message = createLogLine(messages);
	console.log(`\u001B[${open}m ${message} \u001B[${close}m`);
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
	const isUndefined = (key) => !process.env[key];

	/** @param {string} key */
	const handleUndefined = (key) => {
		if (!process.env.fatima_storeMarker) {
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

	const fatimaEnv = new Proxy(process.env, {
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

const env = createEnv({ isServer: undefined }) as Env;

const publicEnv = createPublicEnv({
	publicPrefix: "NEXT_PUBLIC_",
	publicVariables: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL },
}) as PublicEnv;

export { env, publicEnv };
