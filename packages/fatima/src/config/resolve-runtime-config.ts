import { existsSync } from "node:fs";
import path from "node:path";
import type { RuntimeConfigInput, RuntimeProvider } from "../api/types";
import type { FatimaDebugLogger } from "../lib/debug";
import { providers } from "../providers";
import type { FatimaConfig } from ".";
import { isMissingConfigError, loadConfig } from "./read-config";
import type { FatimaProviderChain, UnsafeEnvironmentVariables } from "./types";

export function hasConfigOverrides(options?: RuntimeConfigInput) {
	return Boolean(
		options?.environment || options?.provider || options?.publicPrefix,
	);
}

export function resolveEnvironmentName(
	config?: FatimaConfig,
	options?: RuntimeConfigInput,
	baseEnv = process.env as UnsafeEnvironmentVariables,
) {
	return options?.environment ?? config?.environment(baseEnv) ?? "development";
}

function resolveOutputExtension() {
	return existsSync(path.resolve(process.cwd(), "tsconfig.json"))
		? ".ts"
		: ".js";
}

function createProviderChain(
	provider: RuntimeProvider | undefined,
	environment: string,
): FatimaProviderChain {
	const resolvedProvider = provider ?? "local";

	if (resolvedProvider === "local") {
		return providers.local(".env");
	}

	const providerFactory = providers[
		resolvedProvider as Exclude<RuntimeProvider, "local">
	] as (config: { environment: string }) => ReturnType<typeof providers.heroku>;

	return [providers.local(".env"), providerFactory({ environment })];
}

function createFallbackConfig(options?: RuntimeConfigInput): FatimaConfig {
	const environment = resolveEnvironmentName(undefined, options);
	const extension = resolveOutputExtension();
	const configPath = path.resolve(process.cwd(), `env.config${extension}`);

	return {
		type: null as unknown as FatimaConfig["type"],
		client: options?.publicPrefix
			? { publicPrefix: options.publicPrefix }
			: undefined,
		environment: () => environment,
		providers: {
			[environment]: createProviderChain(options?.provider, environment),
		},
		schema: undefined,
		file: {
			extension,
			folderPath: process.cwd(),
			path: configPath,
		},
	};
}

function mergeRuntimeConfig(
	config: FatimaConfig,
	options?: RuntimeConfigInput,
): FatimaConfig {
	if (!hasConfigOverrides(options)) {
		return config;
	}

	const environment = resolveEnvironmentName(config, options);

	return {
		...config,
		environment: () => environment,
		client: options?.publicPrefix
			? {
					...(config.client ?? {}),
					publicPrefix: options.publicPrefix,
				}
			: config.client,
		providers: options?.provider
			? {
					...config.providers,
					[environment]: createProviderChain(options.provider, environment),
				}
			: config.providers,
	};
}

export async function resolveRuntimeConfig(
	options?: RuntimeConfigInput,
	settings?: {
		requireConfig?: boolean;
		debug?: FatimaDebugLogger;
	},
) {
	try {
		const config = await loadConfig(options?.config, {
			debug: settings?.debug,
		});

		return {
			config: mergeRuntimeConfig(config, options),
			usedFallback: false,
		};
	} catch (error) {
		if (
			options?.config ||
			settings?.requireConfig ||
			!isMissingConfigError(error)
		) {
			throw error;
		}

		return {
			config: createFallbackConfig(options),
			usedFallback: true,
		};
	}
}
