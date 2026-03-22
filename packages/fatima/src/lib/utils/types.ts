// biome-ignore lint/suspicious/noExplicitAny: generic utility helper
export type Any = any;

export type Defined<T> = T extends undefined ? never : T;

export type Promisable<T> = T | Promise<T>;

export interface GenericClass<T, Args extends Any[] = Any[]>
	// biome-ignore lint/complexity/noBannedTypes: let me use the Function type
	extends Function {
	new (...args: Args): T;
}
