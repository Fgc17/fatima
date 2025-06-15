// biome-ignore lint/suspicious/noExplicitAny: I need a AnyType
export type AnyType = any;

export interface GenericClass<T, Args extends AnyType[] = AnyType[]>
	// biome-ignore lint/complexity/noBannedTypes: Let me use the Function type
	extends Function {
	new (...args: Args): T;
}

export type Promisable<T> = T | Promise<T>;
