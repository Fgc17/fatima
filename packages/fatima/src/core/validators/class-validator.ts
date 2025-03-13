import type {
	AnyType,
	FatimaValidator,
	UnsafeEnvironmentVariables,
} from "lib/types";
import { lifecycle } from "lib/lifecycle";

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

export const classValidator = (
	constraint: AnyType,
	helpers: {
		validate: ClassValidatorValidateMock;
		plainToInstance: ClassTransformerPlainToInstance;
	},
): FatimaValidator => {
	return async (env: UnsafeEnvironmentVariables) => {
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
			return lifecycle.error.missingBabelTransformClassProperties();
		}
	};
};
