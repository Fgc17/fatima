export type Any = any;

export type Defined<T> = T extends undefined ? never : T;

export type Promisable<T> = T | Promise<T>;

export interface GenericClass<T, Args extends Any[] = Any[]> extends Function {
	new (...args: Args): T;
}
