import path from "node:path";
import { createJiti } from "jiti";
import { FatimaError } from "../lib/error";
import type { FatimaPlugin } from "./types";

const jiti = createJiti(import.meta.url, {
	interopDefault: true,
	fsCache: false,
});

function isFatimaPlugin(value: unknown): value is FatimaPlugin {
	return Boolean(value && typeof value === "object");
}

export async function loadPlugin(
	specifier: string,
	baseDir = process.cwd(),
): Promise<FatimaPlugin> {
	const resolvedSpecifier = specifier.startsWith(".")
		? path.resolve(baseDir, specifier)
		: specifier;

	let mod: unknown;

	try {
		mod = await jiti.import(resolvedSpecifier);
	} catch (error) {
		throw new FatimaError(`Failed to load Fatima plugin: ${specifier}`, {
			cause: error,
		});
	}

	if (!isFatimaPlugin(mod)) {
		throw new FatimaError(`Invalid Fatima plugin: ${specifier}`);
	}

	return mod;
}
