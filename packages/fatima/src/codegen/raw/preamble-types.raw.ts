type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type AnyValue = any;

type EnvObject = AnyValue;

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

export type Env = CreatePrivateEnv<EnvKeys, "<PUBLIC_>">;

export type PublicEnv = CreatePublicEnv<EnvKeys, "<PUBLIC_>">;
