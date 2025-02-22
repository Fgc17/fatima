/** Utils */
export type Promisable<T> = T | Promise<T>;

// biome-ignore lint/suspicious/noExplicitAny: needs any here
export type AnyType = any;

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export interface GenericClass<T> extends Function {
	new (...args: AnyType[]): T;
}

export type UnsafeEnvironmentVariables = Record<string, string>;
