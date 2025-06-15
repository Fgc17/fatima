import type { AnyType } from "./types";

export const jsonSafeParse = <T extends Record<string | number, AnyType>>(
	json: string,
):
	| {
			json: T;
			error?: never;
	  }
	| { json: null; error: Error } => {
	try {
		return {
			json: (JSON.parse(json) ?? {}) as T,
		};
	} catch (error) {
		return {
			json: null,
			error,
		};
	}
};
