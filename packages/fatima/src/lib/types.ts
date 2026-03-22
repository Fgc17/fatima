import type { StandardSchemaV1 } from "./standard-schema/standard-schema";
import type { Promisable } from "./utils/types";

export type UnsafeEnvironmentVariables = Record<string, string>;

export type FatimaEnvironment = string;

export type FatimaProviderFetch = (
	processEnv?: UnsafeEnvironmentVariables,
) => Promisable<UnsafeEnvironmentVariables>;

export type FatimaProvider = {
	fetch: FatimaProviderFetch;
};

export type FatimaProviderChain = FatimaProvider | FatimaProvider[];

export type FatimaProviderObject = {
	[env in FatimaEnvironment]?: FatimaProviderChain;
};

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
	SchemaType extends FatimaValidatorShape,
	PublicPrefix extends string,
> = {
	public: CreatePublicEnv<SchemaType, PublicPrefix>;
	private: CreatePrivateEnv<SchemaType, PublicPrefix>;
	all: SchemaType;
};

export type FatimaValidatorShape = Record<string, string>;

export type FatimaEnvironmentFunction = (
	processEnv: UnsafeEnvironmentVariables,
) => string;

export type FatimaStandardSchema = StandardSchemaV1<
	UnsafeEnvironmentVariables,
	UnsafeEnvironmentVariables
>;

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

export type InferStandardSchemaShape<Schema extends FatimaStandardSchema> =
	Schema["~standard"]["types"] extends {
		output: infer Output;
	}
		? Output extends FatimaValidatorShape
			? Output
			: FatimaValidatorShape
		: FatimaValidatorShape;
