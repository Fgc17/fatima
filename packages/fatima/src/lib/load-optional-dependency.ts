import { createRequire } from "node:module";
import { FatimaError } from "./error";

const require = createRequire(import.meta.url);

export function loadOptionalDependency<T>(
	specifier: string,
	message: string,
): T {
	let resolvedPath: string;

	try {
		resolvedPath = require.resolve(specifier, {
			paths: [process.cwd()],
		});
	} catch (error) {
		throw new FatimaError(message, { cause: error });
	}

	try {
		return require(resolvedPath) as T;
	} catch (error) {
		throw new FatimaError(`Failed to load optional dependency: ${specifier}.`, {
			cause: error,
		});
	}
}
