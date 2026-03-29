import type { StandardSchemaV1 } from "../lib/standard-schema";
import type { Promisable } from "../lib/types";

export type UnsafeEnvironmentVariables = Record<string, string>;

export type FatimaEnvironment = string;

export type FatimaProviderFetch = (
	processEnv?: UnsafeEnvironmentVariables,
) => Promisable<UnsafeEnvironmentVariables>;

export type FatimaProvider = {
	fetch: FatimaProviderFetch;
};

export type FatimaProviderConfig = {
	environment?: string;
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
	Shape extends UnsafeEnvironmentVariables,
	PublicPrefix extends string,
> = {
	public: CreatePublicEnv<Shape, PublicPrefix>;
	private: CreatePrivateEnv<Shape, PublicPrefix>;
	all: Shape;
};

export type FatimaEnvironmentFunction = (
	processEnv: UnsafeEnvironmentVariables,
) => string;

export type FatimaStandardSchema = StandardSchemaV1<
	UnsafeEnvironmentVariables,
	UnsafeEnvironmentVariables
>;

export interface FatimaClientOptions<PublicPrefix extends string> {
	publicPrefix?: PublicPrefix;
	isServer?: () => boolean;
}

export type InferStandardSchemaShape<Schema extends FatimaStandardSchema> =
	StandardSchemaV1.InferOutput<Schema>;
