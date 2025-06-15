import type { FatimaValidator } from "lib/types";

export type ZodSchemaMock = {
	safeParse: (env: unknown) => {
		success: boolean;
		error?: {
			errors: Array<{
				path: (string | number)[];
				message: string;
			}>;
		};
		data?: unknown;
	};
};

export const zod =
	(constraint: ZodSchemaMock): FatimaValidator =>
	(env) => {
		const result = constraint.safeParse(env);

		const isValid = result.success;

		const errors =
			result.error?.errors.map((error) => ({
				key: error.path.join("."),
				message: error.message,
			})) ?? [];

		return {
			isValid,
			errors,
		};
	};
