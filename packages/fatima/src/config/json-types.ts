export type FatimaJsonProviderEntry = {
	provider: string;
	[key: string]: unknown;
};

export type FatimaJsonModelConfigValue =
	| string
	| {
			type: string;
			args?: Record<string, unknown>;
	  };

export type FatimaJsonModelConfig = Record<string, FatimaJsonModelConfigValue>;

export type FatimaJsonProvidersConfig = Record<
	string,
	FatimaJsonProviderEntry[]
>;

export type FatimaJsonConfig = {
	$schema?: string;
	generator: string;
	file?: string;
	formatter?: string;
	environment?: string;
	plugins?: string[];
	publicPrefix?: string;
	providers?: FatimaJsonProvidersConfig;
	model?: FatimaJsonModelConfig;
};
