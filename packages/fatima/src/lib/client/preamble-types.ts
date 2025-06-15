/* eslint-disable @fatima/no-process-env */
/* eslint-disable @typescript-eslint/no-explicit-any */ // For ESLint
// biome-ignore lint/suspicious/noExplicitAny: For Biome
type AnyType = any;

type EnvObject = AnyType;

type FatimaEnvRecord<EnvObject, EnvValues = AnyType> = {
	[K in keyof EnvObject as K extends string ? K : never]: EnvValues;
};

type FatimaPrimitiveEnvType<EnvObject> = {
	[K in keyof EnvObject as K extends string ? K : never]?: AnyType;
};

type FatimaEnvType<
	EnvObject,
	Type extends
		FatimaPrimitiveEnvType<EnvObject> = FatimaPrimitiveEnvType<EnvObject>,
> = Type;

export type CreatePrivateEnv<
	Keys extends PropertyKey,
	Prefix extends string,
> = {
	[K in Keys as K extends `${Prefix}${string}` ? never : K]: EnvObject[K];
};

export type CreatePublicEnv<Keys extends PropertyKey, Prefix extends string> = {
	[K in Keys as K extends `${Prefix}${string}` ? K : never]: EnvObject[K];
};

export type EnvKeys = keyof EnvObject;

export type EnvRecord<V = string> = FatimaEnvRecord<EnvObject, V>;

export type EnvType<T extends FatimaPrimitiveEnvType<EnvObject>> =
	FatimaEnvType<EnvObject, T>;

export type Env = CreatePrivateEnv<EnvKeys, "<PUBLIC_>">;

export type PublicEnv = CreatePublicEnv<EnvKeys, "<PUBLIC_>">;
