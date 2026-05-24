import { evaluateEnvironmentExpression } from "../config/evaluate-environment";
import { interpolateValue } from "../config/interpolate";
import type {
	NormalizedFatimaConfig,
	UnsafeEnvironmentVariables,
} from "../config/types";
import type { FatimaDebugLogger } from "../lib/debug";
import { FatimaError } from "../lib/error";
import type { FatimaRegistry } from "../plugins/registry";

export type LoadedEnvironment = {
	env: UnsafeEnvironmentVariables;
	environment: string;
	loadedEnv: UnsafeEnvironmentVariables;
	providersUsed: number;
};

export async function loadEnvironment(
	config: NormalizedFatimaConfig,
	registry: FatimaRegistry,
	options: {
		debug?: FatimaDebugLogger;
		environment?: string;
		useProcessEnv?: boolean;
	} = {},
): Promise<LoadedEnvironment> {
	const baseEnv = { ...process.env } as UnsafeEnvironmentVariables;

	const environment =
		options.environment ??
		evaluateEnvironmentExpression(config.environmentExpression, baseEnv);

	options.debug?.debug("env:resolve", "Resolved target environment", {
		environment,
		hasEnvironmentOverride: Boolean(options.environment),
		baseVariableCount: Object.keys(baseEnv).length,
	});

	if (!environment) {
		throw new FatimaError(
			"fatima.json `environment` resolved to an empty value. Return a concrete environment name.",
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

	const providerEntries = config.providers[environment] ?? [];

	options.debug?.debug("env:providers", "Resolved providers for environment", {
		environment,
		providerCount: providerEntries.length,
	});

	if (providerEntries.length === 0) {
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

	for (const [index, entry] of providerEntries.entries()) {
		options.debug?.debug(
			"env:provider:start",
			"Fetching provider environment",
			{
				environment,
				providerIndex: index,
				providerCount: providerEntries.length,
				providerName: entry.provider,
			},
		);

		const providerFactory = registry.providers[entry.provider];

		if (!providerFactory) {
			throw new FatimaError(`Unknown Fatima provider: ${entry.provider}`);
		}

		const providerConfig = interpolateValue(
			Object.fromEntries(
				Object.entries(entry).filter(([key]) => key !== "provider"),
			),
			currentEnv,
		);

		const provider = providerFactory(providerConfig);
		const nextEnv = await provider.fetch({
			cwd: config.configFile.folderPath,
			environment,
			env: currentEnv,
		});

		if (
			!nextEnv ||
			typeof nextEnv !== "object" ||
			Array.isArray(nextEnv) ||
			Object.values(nextEnv).some((value) => typeof value !== "string")
		) {
			throw new FatimaError(
				`Fatima provider ${entry.provider} must return Record<string, string>.`,
			);
		}

		currentEnv = { ...currentEnv, ...nextEnv };
		loadedEnv = { ...loadedEnv, ...nextEnv };
		options.debug?.debug("env:provider:done", "Merged provider environment", {
			environment,
			providerIndex: index,
			loadedVariableCount: Object.keys(nextEnv).length,
			totalLoadedVariableCount: Object.keys(loadedEnv).length,
		});
	}

	const resolvedEnvironment = evaluateEnvironmentExpression(
		config.environmentExpression,
		currentEnv,
	);

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
		providersUsed: providerEntries.length,
	};
}
