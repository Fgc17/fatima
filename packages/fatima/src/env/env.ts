import type { UnsafeEnvironmentVariables } from "src/core/types";
import type { AnyType } from "src/lib/types";
import { lifecycle } from "src/core/lifecycle";
import { logger } from "src/lib/logger/logger";
import { fatimaStore } from "src/lib/store/store";
import { parseEnvLines } from "src/lib/env/parse-env";

interface CreateEnvOptions {
	isServer?: () => boolean;
}

interface CreatePublicEnvOptions {
	publicPrefix: string;
	publicVariables: UnsafeEnvironmentVariables;
}

export type EnvRecord<EnvObject, EnvValues = AnyType> = {
	[K in keyof EnvObject as K extends string ? K : never]: EnvValues;
};

export type PrimitiveEnvType<EnvObject> = {
	[K in keyof EnvObject as K extends string ? K : never]?: AnyType;
};

export type EnvType<
	EnvObject,
	Type extends PrimitiveEnvType<EnvObject> = PrimitiveEnvType<EnvObject>,
> = Type;

export type ServerEnvRecord<Keys extends string, Prefix extends string> = {
	[K in Keys as K extends `${Prefix}${string}` ? never : K]: string;
};

export type PublicEnvRecord<Keys extends string, Prefix extends string> = {
	[K in Keys as K extends `${Prefix}${string}` ? K : never]: string;
};

export const createEnv = (options: CreateEnvOptions) => {
	const isServer = options.isServer || (() => typeof window === "undefined");

	const isAccessForbidden = () => !isServer();

	const isUndefined = (key: string) => !process.env[key];

	const handleUndefined = (key: string) => {
		if (!fatimaStore.exists()) {
			return lifecycle.error.undefinedEnvironmentAndStore(key);
		}

		return lifecycle.error.undefinedEnvironment(key);
	};

	const handleForbiddenAccess = (key: string) => {
		const error = [
			"Here are some possible fixes:",
			"\n 1. Add the public prefix to your variable if you want to expose it to the client.",
			"\n 2. Check if your public prefix is correct by assigning 'env.publicPrefix' to your fatima configuration.",
		];

		logger.error(...error);

		throw new Error(
			`🔒 [fatima] Environment variable ${key} not allowed on the client.` +
				error.join("\n"),
		);
	};

	const fatimaEnv = new Proxy(process.env, {
		get(target, key: string) {
			if (isAccessForbidden()) {
				handleForbiddenAccess(key);
			}

			if (isUndefined(key)) {
				handleUndefined(key);
			}

			return Reflect.get(target, key);
		},
	});

	return fatimaEnv as UnsafeEnvironmentVariables;
};

export const createPublicEnv = (options: CreatePublicEnvOptions) => {
	const isUndefined = (key: string) => {
		if (!options.publicVariables[key]) {
			return true;
		}
	};

	const handleUndefined = (key: string) => {
		throw new Error(`🔒 [fatima] Environment variable ${key} not found.`);
	};

	const fatimaPublicEnv = new Proxy(options.publicVariables, {
		get(target, key: string) {
			if (isUndefined(key)) {
				handleUndefined(key);
			}

			return Reflect.get(target, key);
		},
	});

	return fatimaPublicEnv as UnsafeEnvironmentVariables;
};

export const parse = parseEnvLines;
