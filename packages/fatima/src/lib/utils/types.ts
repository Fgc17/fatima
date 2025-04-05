// biome-ignore lint/suspicious/noExplicitAny: I need a AnyType
export type AnyType = any;

// biome-ignore lint/complexity/noBannedTypes: Let me use the Function type
export interface GenericClass<T> extends Function {
	new (...args: AnyType[]): T;
}

export type Promisable<T> = T | Promise<T>;
