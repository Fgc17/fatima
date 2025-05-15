import type { Promisable } from "./utils/types";

export type UnsafeEnvironmentVariables = Record<string, string>;

export type FatimaEnvironment = string;

export type FatimaBuiltInLoadFunction =
	() => Promisable<UnsafeEnvironmentVariables>;

export type FatimaCustomLoadFunction = (
	processEnv: UnsafeEnvironmentVariables,
) => Promisable<UnsafeEnvironmentVariables>;

export type FatimaLoadFunction =
	| FatimaBuiltInLoadFunction
	| FatimaCustomLoadFunction;

export type FatimaLoadConfig<Config> = (
	processEnv: UnsafeEnvironmentVariables,
) => Promisable<Config>;

export type FatimaLoaderChain = FatimaLoadFunction[] | FatimaLoadFunction;

export type FatimaLoadObject<Environments extends FatimaEnvironment> = {
	[env in Environments]?: FatimaLoaderChain;
};

export type FatimaValidatorError = {
	key: string;
	message: string;
};

export type FatimaValidationResult = {
	isValid: boolean;
	errors: FatimaValidatorError[];
};

export type FatimaValidator = (
	env: UnsafeEnvironmentVariables,
) => Promisable<FatimaValidationResult>;

export type FatimaParsedValidationErrors = Record<string, string[]>;

export type FatimaEnvironmentFunction = (
	processEnv: UnsafeEnvironmentVariables,
) => string;

export interface FatimaClientOptions {
	/**
	 * Prefix for public secrets
	 */
	publicPrefix?: string;
	/**
	 * Function to verify server environment
	 */
	isServer?: () => boolean;
}
