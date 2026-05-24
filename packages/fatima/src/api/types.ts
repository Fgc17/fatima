export type RuntimeConfigInput = {
	config?: string;
	environment?: string;
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

export type ApiEnvironmentOptions = RuntimeConfigInput;
export type ApiGenerateOptions = GenerateOptions;
export type ApiRunOptions = RunOptions;
