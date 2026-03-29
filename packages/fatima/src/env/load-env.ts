import type { FatimaConfig } from "../config";
import type {
	FatimaProvider,
	FatimaProviderChain,
	UnsafeEnvironmentVariables,
} from "../config/types";
import type { FatimaDebugLogger } from "../lib/debug";
import { FatimaError } from "../lib/error";

export type LoadedEnvironment = {
	env: UnsafeEnvironmentVariables;
	environment: string;
	loadedEnv: UnsafeEnvironmentVariables;
	providersUsed: number;
};

function normalizeProviders(provider?: FatimaProviderChain): FatimaProvider[] {
	if (!provider) {
		return [];
	}

	return Array.isArray(provider) ? provider : [provider];
}

export async function loadEnvironment(
	config: FatimaConfig,
	options: {
		debug?: FatimaDebugLogger;
		environment?: string;
		useProcessEnv?: boolean;
	} = {},
): Promise<LoadedEnvironment> {
	const baseEnv = { ...process.env } as UnsafeEnvironmentVariables;

	const environment =
		options.environment ??
		config.environment(baseEnv as UnsafeEnvironmentVariables);

	options.debug?.debug("env:resolve", "Resolved target environment", {
		environment,
		hasEnvironmentOverride: Boolean(options.environment),
		baseVariableCount: Object.keys(baseEnv).length,
	});

	if (!environment) {
		throw new FatimaError(
			"config.environment returned an empty value. Return a concrete environment name.",
		);
	}

	if (options.useProcessEnv) {
		options.debug?.debug(
			"env:process-env",
			"Using process.env without providers",
			{
				environment,
				variableCount: Object.keys(baseEnv).length,
			},
		);
		return {
			env: baseEnv,
			environment,
			loadedEnv: baseEnv,
			providersUsed: 0,
		};
	}

	const providers = normalizeProviders(config.providers[environment]);

	options.debug?.debug("env:providers", "Resolved providers for environment", {
		environment,
		providerCount: providers.length,
	});

	if (providers.length === 0) {
		options.debug?.debug(
			"env:no-providers",
			"No providers configured for environment",
			{
				environment,
				variableCount: Object.keys(baseEnv).length,
			},
		);
		return {
			env: baseEnv,
			environment,
			loadedEnv: baseEnv,
			providersUsed: 0,
		};
	}

	let currentEnv = { ...baseEnv };
	let loadedEnv = {} as UnsafeEnvironmentVariables;

	for (const [index, provider] of providers.entries()) {
		options.debug?.debug(
			"env:provider:start",
			"Fetching provider environment",
			{
				environment,
				providerIndex: index,
				providerCount: providers.length,
			},
		);
		const nextEnv = await provider.fetch(currentEnv);
		currentEnv = { ...currentEnv, ...nextEnv };
		loadedEnv = { ...loadedEnv, ...nextEnv };
		options.debug?.debug("env:provider:done", "Merged provider environment", {
			environment,
			providerIndex: index,
			loadedVariableCount: Object.keys(nextEnv).length,
			totalLoadedVariableCount: Object.keys(loadedEnv).length,
		});
	}

	const resolvedEnvironment = config.environment(currentEnv);
	options.debug?.debug(
		"env:verify",
		"Verified resolved environment after loading",
		{
			initialEnvironment: environment,
			resolvedEnvironment,
		},
	);

	if (resolvedEnvironment !== environment) {
		throw new FatimaError(
			`Environment changed while loading from providers: started with ${environment} and ended as ${resolvedEnvironment}.`,
		);
	}

	return {
		env: currentEnv,
		environment,
		loadedEnv,
		providersUsed: providers.length,
	};
}
