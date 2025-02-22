import type { FatimaValidatorError } from "../types";

export function parseValidationErrors(errors: FatimaValidatorError[]) {
	const groupedErrors = errors.reduce(
		(acc, error) => {
			const key = error.key;

			if (!acc[key]) {
				acc[key] = [];
			}

			acc[key].push(error.message);

			return acc;
		},
		{} as Record<string, string[]>,
	);

	return groupedErrors;
}
