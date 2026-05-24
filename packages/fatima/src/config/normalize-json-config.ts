import path from "node:path";
import { FatimaError } from "../lib/error";
import type {
	FatimaJsonConfig,
	FatimaJsonModelConfig,
	FatimaJsonProviderEntry,
	FatimaJsonProvidersConfig,
} from "./json-types";
import type { NormalizedFatimaConfig } from "./types";

const defaultGeneratorFiles: Record<string, string> = {
	typescript: "env.ts",
	javascript: "env.js",
	python: "env.py",
};

function isProviderEntry(value: unknown): value is FatimaJsonProviderEntry {
	return Boolean(
		value &&
			typeof value === "object" &&
			typeof (value as FatimaJsonProviderEntry).provider === "string",
	);
}

export function normalizeJsonConfig(
	rawConfig: FatimaJsonConfig,
	configPath: string,
): NormalizedFatimaConfig {
	if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
		throw new FatimaError("fatima.json must contain a JSON object.");
	}

	if (!rawConfig.generator || typeof rawConfig.generator !== "string") {
		throw new FatimaError("fatima.json must define a string `generator`.");
	}

	if (
		rawConfig.providers != null &&
		(typeof rawConfig.providers !== "object" || Array.isArray(rawConfig.providers))
	) {
		throw new FatimaError("fatima.json `providers` must be an object.");
	}

	const providers: FatimaJsonProvidersConfig = {};

	for (const [key, value] of Object.entries(rawConfig.providers ?? {})) {
		if (!Array.isArray(value)) {
			throw new FatimaError(
				`providers.${key} in fatima.json must be an array of provider entries.`,
			);
		}

		providers[key] = value.map((entry, index) => {
			if (!isProviderEntry(entry)) {
				throw new FatimaError(
					`providers.${key}[${index}] in fatima.json must be an object with a string \`provider\`.`,
				);
			}

			return entry;
		});
	}

	if (
		rawConfig.model != null &&
		(typeof rawConfig.model !== "object" || Array.isArray(rawConfig.model))
	) {
		throw new FatimaError("fatima.json `model` must be an object.");
	}

	const model = rawConfig.model as FatimaJsonModelConfig | undefined;

	return {
		generator: rawConfig.generator,
		file: rawConfig.file ?? defaultGeneratorFiles[rawConfig.generator] ?? "env",
		formatter:
			typeof rawConfig.formatter === "string"
				? rawConfig.formatter
				: undefined,
		environmentExpression: rawConfig.environment ?? "'development'",
		plugins: Array.isArray(rawConfig.plugins)
			? rawConfig.plugins.filter((item): item is string => typeof item === "string")
			: [],
		publicPrefix:
			typeof rawConfig.publicPrefix === "string"
				? rawConfig.publicPrefix
				: undefined,
		model,
		providers,
		configFile: {
			path: configPath,
			folderPath: path.dirname(configPath),
		},
	};
}
