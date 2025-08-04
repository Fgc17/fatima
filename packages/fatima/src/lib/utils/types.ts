// biome-ignore lint/suspicious/noExplicitAny: I need a AnyType
export type AnyType = any;

export type Defined<T> = T extends undefined ? never : T;

export type Promisable<T> = T | Promise<T>;

export interface GenericClass<T, Args extends AnyType[] = AnyType[]>
	// biome-ignore lint/complexity/noBannedTypes: let me use the Function type
	extends Function {
	new (...args: Args): T;
}
