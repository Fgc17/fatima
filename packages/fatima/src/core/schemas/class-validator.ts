import type {
	FatimaSchema,
	FatimaSchemaType,
	UnsafeEnvironmentVariables,
} from "lib/types";
import type { AnyType, GenericClass } from "lib/utils/types";
import { wording } from "lib/wording";

export type ClassValidatorValidateMock = (instance: AnyType) => Promise<
	Array<{
		property: string;
		constraints?: {
			[type: string]: string;
		};
	}>
>;

export type ClassTransformerPlainToInstance = (
	constraint: AnyType,
	object: AnyType,
) => AnyType;

export const classValidator = <S extends FatimaSchemaType>(
	constraint: GenericClass<S>,
	helpers: {
		validate: ClassValidatorValidateMock;
		plainToInstance: ClassTransformerPlainToInstance;
	},
): FatimaSchema<S> => {
	const validate = async (env: UnsafeEnvironmentVariables) => {
		try {
			const instance = helpers.plainToInstance(constraint, env);

			const classValidatorErrors = await helpers.validate(instance);

			const isValid = classValidatorErrors.length === 0;

			const errors = isValid
				? []
				: classValidatorErrors.flatMap((error) =>
						Object.values(error.constraints ?? {}).map((value) => ({
							key: error.property,
							message: value,
						})),
					);

			return {
				isValid,
				errors,
			};
		} catch {
			throw new Error(wording.error.missingBabelTransformClassProperties());
		}
	};

	return {
		$type: null as unknown as S,
		validate,
	};
};
