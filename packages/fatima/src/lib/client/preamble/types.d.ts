/* eslint-disable @typescript-eslint/no-explicit-any */ // For ESLint
// biome-ignore lint/suspicious/noExplicitAny: For Biome
type AnyType = any;

export type EnvObject = AnyType;

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
