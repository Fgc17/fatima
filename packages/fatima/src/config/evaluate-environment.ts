import { FatimaError } from "../lib/error";
import type { UnsafeEnvironmentVariables } from "./types";

const envTokenRegex = /\{env:([A-Za-z_][A-Za-z0-9_]*)\}/g;

export function evaluateEnvironmentExpression(
	expression: string,
	env: UnsafeEnvironmentVariables,
): string {
	const jsExpression = expression.replaceAll(
		envTokenRegex,
		(_, key: string) => `env[${JSON.stringify(key)}]`,
	);

	let result: unknown;

	try {
		result = new Function("env", `"use strict"; return (${jsExpression});`)(
			env,
		);
	} catch (error) {
		throw new FatimaError(
			`Failed to evaluate fatima environment expression: ${expression}`,
			{ cause: error },
		);
	}

	if (typeof result !== "string" || result.length === 0) {
		throw new FatimaError(
			"fatima.json `environment` must evaluate to a non-empty string.",
		);
	}

	return result;
}
