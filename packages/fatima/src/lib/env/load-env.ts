import type { FatimaConfig } from "../../core/config";
import { FatimaError } from "../errors";
import type {
	FatimaProvider,
	FatimaProviderChain,
	UnsafeEnvironmentVariables,
} from "../types";

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
		environment?: string;
		useProcessEnv?: boolean;
	} = {},
): Promise<LoadedEnvironment> {
	const baseEnv = { ...process.env } as UnsafeEnvironmentVariables;
	const environment =
		options.environment ??
		config.environment(baseEnv as UnsafeEnvironmentVariables);

	if (!environment) {
		throw new FatimaError(
			"config.environment returned an empty value. Return a concrete environment name.",
		);
	}

	if (options.useProcessEnv) {
		return {
			env: baseEnv,
			environment,
			loadedEnv: baseEnv,
			providersUsed: 0,
		};
	}

	const providers = normalizeProviders(config.providers[environment]);

	if (providers.length === 0) {
		return {
			env: baseEnv,
			environment,
			loadedEnv: baseEnv,
			providersUsed: 0,
		};
	}

	let currentEnv = { ...baseEnv };
	let loadedEnv = {} as UnsafeEnvironmentVariables;

	for (const provider of providers) {
		const nextEnv = await provider.fetch(currentEnv);
		currentEnv = { ...currentEnv, ...nextEnv };
		loadedEnv = { ...loadedEnv, ...nextEnv };
	}

	const resolvedEnvironment = config.environment(currentEnv);

	if (resolvedEnvironment !== environment) {
		throw new FatimaError(
			`Environment changed while loading providers: started with ${environment} and resolved to ${resolvedEnvironment}.`,
		);
	}

	return {
		env: currentEnv,
		environment,
		loadedEnv,
		providersUsed: providers.length,
	};
}

export function populateEnv(env: UnsafeEnvironmentVariables): void {
	Object.assign(process.env, env);
}
