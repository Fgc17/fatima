import type {
	FatimaSchema,
	FatimaSchemaType,
	FatimaValidator,
} from "lib/types";

export type ZodSchemaMock<S> = {
	_type: S;
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

export const zod = <Type extends FatimaSchemaType>(
	constraint: ZodSchemaMock<Type>,
): FatimaSchema<Type> => {
	const validate: FatimaValidator = (env) => {
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

	const $type = constraint._type;

	return {
		validate,
		$type,
	};
};
