import { FatimaError } from "../lib/error";
import type { UnsafeEnvironmentVariables } from "./types";

const envTokenRegex = /\{env:([A-Za-z_][A-Za-z0-9_]*)\}/g;

function interpolateString(
	value: string,
	env: UnsafeEnvironmentVariables,
): string {
	return value.replaceAll(envTokenRegex, (_, key: string) => {
		const resolved = env[key];

		if (resolved == null) {
			throw new FatimaError(
				`Missing environment variable referenced in fatima.json: ${key}`,
			);
		}

		return resolved;
	});
}

export function interpolateValue<T>(
	value: T,
	env: UnsafeEnvironmentVariables,
): T {
	if (typeof value === "string") {
		return interpolateString(value, env) as T;
	}

	if (Array.isArray(value)) {
		return value.map((item) => interpolateValue(item, env)) as T;
	}

	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [
				key,
				interpolateValue(item, env),
			]),
		) as T;
	}

	return value;
}
