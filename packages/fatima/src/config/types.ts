import type {
	FatimaJsonModelConfig,
	FatimaJsonProvidersConfig,
} from "./json-types";

export type UnsafeEnvironmentVariables = Record<string, string>;

export type NormalizedFatimaConfig = {
	generator: string;
	file: string;
	formatter?: string;
	environmentExpression: string;
	plugins: string[];
	publicPrefix?: string;
	model?: FatimaJsonModelConfig;
	providers: FatimaJsonProvidersConfig;
	configFile: {
		path: string;
		folderPath: string;
	};
};
