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

export type FatimaLoadObject = {
	[env in FatimaEnvironment]?: FatimaLoaderChain;
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

export type CreatePrivateEnv<
	EnvObject extends UnsafeEnvironmentVariables,
	Prefix extends string,
> = {
	[K in keyof EnvObject as K extends `${Prefix}${string}`
		? never
		: K]: EnvObject[K];
};

export type CreatePublicEnv<
	EnvObject extends UnsafeEnvironmentVariables,
	Prefix extends string,
> = {
	[K in keyof EnvObject as K extends `${Prefix}${string}`
		? K
		: never]: EnvObject[K];
};

export type FatimaEnvType<
	SchemaType extends FatimaSchemaType,
	PublicPrefix extends string,
> = {
	public: CreatePublicEnv<SchemaType, PublicPrefix>;
	private: CreatePrivateEnv<SchemaType, PublicPrefix>;
	all: SchemaType;
};

export type FatimaSchemaType = Record<string, string>;

export type FatimaSchema<Type extends FatimaSchemaType> = {
	$type: Type;
	validate: FatimaValidator;
};

export type FatimaParsedValidationErrors = Record<string, string[]>;

export type FatimaEnvironmentFunction = (
	processEnv: UnsafeEnvironmentVariables,
) => string;

export interface FatimaClientOptions<PublicPrefix extends string> {
	/**
	 * Prefix for public secrets
	 */
	publicPrefix?: PublicPrefix;
	/**
	 * Function to verify server environment
	 */
	isServer?: () => boolean;
}
