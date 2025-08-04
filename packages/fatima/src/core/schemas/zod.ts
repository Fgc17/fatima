import type {
	FatimaSchema,
	FatimaSchemaType,
	FatimaValidator,
} from "lib/types";
import type { AnyType, Defined } from "lib/utils/types";

export type ZodSchemaMock<S> = {
	spa: (...params: AnyType[]) => Promise<{
		data?: S;
		error?: AnyType;
		success: boolean;
	}>;
	safeParse: (env: unknown) => {
		success: boolean;
		error?: {
			issues: Array<{
				path: PropertyKey[];
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
			result.error?.issues.map((error) => ({
				key: error.path.join("."),
				message: error.message,
			})) ?? [];

		return {
			isValid,
			errors,
		};
	};

	const $type = null as unknown as Defined<
		Awaited<ReturnType<typeof constraint.spa>>["data"]
	>;

	return {
		validate,
		$type,
	};
};
