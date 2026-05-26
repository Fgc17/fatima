export type Awaitable<T> = T | Promise<T>;

export type FatimaEnv = Record<string, string>;

export interface FatimaProviderContext {
	cwd: string;
	environment: string;
	env: FatimaEnv;
}

export interface FatimaProvider {
	fetch(context: FatimaProviderContext): Awaitable<FatimaEnv>;
}

export type FatimaProviderFactory<TConfig = Record<string, unknown>> = (
	config: TConfig,
) => FatimaProvider;

export type AnyFatimaProviderFactory = FatimaProviderFactory<any>;

export interface FatimaModelContext {
	key: string;
	env: FatimaEnv;
	config: unknown;
}

export type FatimaModelValidator = (
	value: string | undefined,
	context: FatimaModelContext,
) => Awaitable<string | undefined>;

export interface FatimaModelGeneratorSpec {
	type?: string;
	wrap: string;
	imports?: string[];
}

export interface FatimaModel {
	validate?: FatimaModelValidator;
	generators: Record<string, FatimaModelGeneratorSpec>;
}

export interface FatimaGeneratedFile {
	path: string;
	content: string;
}

export interface FatimaGeneratorContext {
	cwd: string;
	configPath: string;
	generator: string;
	file: string;
	formatter?: string;
	environment: string;
	env: FatimaEnv;
	loadedEnv: FatimaEnv;
	publicPrefix?: string;
	model?: Record<string, unknown>;
	registry: {
		models: Record<string, FatimaModel>;
	};
}

export interface FatimaGenerator {
	generate(context: FatimaGeneratorContext): Awaitable<FatimaGeneratedFile[]>;
}

export interface FatimaPlugin {
	name?: string;
	providers?: Record<string, AnyFatimaProviderFactory>;
	models?: Record<string, FatimaModel>;
	generators?: Record<string, FatimaGenerator>;
}
