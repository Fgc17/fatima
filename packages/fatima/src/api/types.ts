import type { providers } from "../providers";

export type RuntimeProvider = keyof typeof providers;

export type RuntimeConfigInput = {
	config?: string;
	environment?: string;
	provider?: RuntimeProvider;
	publicPrefix?: string;
	processEnv?: boolean;
	debug?: boolean;
	log?: boolean;
};

export type GenerateOptions = RuntimeConfigInput & {
	strict?: boolean;
};

export type RunOptions = RuntimeConfigInput & {
	stdio?: "ignore" | "inherit";
};

export type ApiGenerateProvider = RuntimeProvider;
export type ApiEnvironmentOptions = RuntimeConfigInput;
export type ApiGenerateOptions = GenerateOptions;
export type ApiRunOptions = RunOptions;
