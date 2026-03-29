import { generateClient } from "../codegen/generate-client";
import type { FatimaConfig } from "../config";
import {
	hasConfigOverrides,
	resolveEnvironmentName,
	resolveRuntimeConfig,
} from "../config/resolve-runtime-config";
import type { LoadedEnvironment } from "../env/load-env";
import { loadEnvironment } from "../env/load-env";
import { validateEnvironment } from "../env/validate-environment";
import { createDebugLogger } from "../lib/debug";
import { createLog } from "../lib/log";
import { runCommand } from "../lib/run-command";
import type { GenerateOptions, RunOptions, RuntimeConfigInput } from "./types";

export { register, registerAsync } from "./register";
export type {
	ApiGenerateProvider,
	GenerateOptions,
	RunOptions,
	RuntimeConfigInput,
	RuntimeProvider,
} from "./types";

type WorkflowContext = {
	config: FatimaConfig;
	debug: ReturnType<typeof createDebugLogger>;
	log: ReturnType<typeof createLog>;
	result: LoadedEnvironment;
	usedFallback: boolean;
};

async function getWorkflowContext(
	options?: RuntimeConfigInput,
	settings?: { requireConfig?: boolean },
): Promise<WorkflowContext> {
	const debug = createDebugLogger(options?.debug);
	const log = createLog(options?.log);
	debug.debug("workflow:start", "Preparing Fatima workflow", {
		hasConfigOverride: Boolean(options?.config),
		hasEnvironmentOverride: Boolean(options?.environment),
		hasProviderOverride: Boolean(options?.provider),
		hasPublicPrefixOverride: Boolean(options?.publicPrefix),
		processEnv: Boolean(options?.processEnv),
	});

	const { config, usedFallback } = await resolveRuntimeConfig(options, {
		requireConfig: settings?.requireConfig,
		debug,
	});

	const result = await loadEnvironment(config, {
		environment: options?.environment,
		useProcessEnv: options?.processEnv,
		debug,
	});

	debug.debug("workflow:ready", "Fatima workflow context resolved", {
		environment: result.environment,
		providersUsed: result.providersUsed,
		loadedVariableCount: Object.keys(result.loadedEnv).length,
		usedFallback,
	});

	return { config, debug, log, result, usedFallback };
}

export async function validate(options?: RuntimeConfigInput) {
	const context = await getWorkflowContext(options, { requireConfig: true });
	context.debug.debug("validate:start", "Validating environment", {
		environment: context.result.environment,
	});

	await validateEnvironment(context.config, context.result.env, {
		debug: context.debug,
	});
	context.debug.debug("validate:done", "Environment validation completed", {
		environment: context.result.environment,
	});
	context.log.success("Environment is valid.");
	context.log.dim(`Environment: ${context.result.environment}`);

	return context.result;
}

export async function generate(options?: GenerateOptions) {
	const context = await getWorkflowContext(options);

	if (context.usedFallback) {
		context.debug.debug(
			"generate:fallback-config",
			"No config file found; using generated fallback config",
			{
				environment: resolveEnvironmentName(undefined, options),
				outputExtension: context.config.file.extension,
				provider: options?.provider ?? "local",
				publicPrefix: options?.publicPrefix,
			},
		);
	} else if (hasConfigOverrides(options)) {
		context.debug.debug(
			"generate:override-config",
			"Using generate config overrides from CLI flags",
			{
				environment: context.result.environment,
				outputExtension: context.config.file.extension,
				provider: options?.provider,
				publicPrefix: options?.publicPrefix,
			},
		);
	}

	context.debug.debug("generate:start", "Generating client file", {
		environment: context.result.environment,
		strict: Boolean(options?.strict),
	});

	if (options?.strict && context.config.schema) {
		context.debug.debug(
			"generate:strict-validate",
			"Running validation before code generation",
			{ environment: context.result.environment },
		);
		await validateEnvironment(context.config, context.result.env, {
			debug: context.debug,
		});
	}

	const outputPath = await generateClient(
		context.config,
		context.result.loadedEnv,
		context.debug,
	);
	context.debug.debug("generate:done", "Client file generated", {
		outputPath,
		loadedVariableCount: Object.keys(context.result.loadedEnv).length,
	});
	context.log.success(`Generated ${outputPath}`);
	context.log.dim(
		`Environment: ${context.result.environment} (${Object.keys(context.result.loadedEnv).length} vars)`,
	);

	return {
		...context.result,
		outputPath,
	};
}

export async function run(command: string[], options?: RunOptions) {
	const context = await getWorkflowContext(options);
	context.log.info(
		`Loaded ${Object.keys(context.result.loadedEnv).length} vars for ${context.result.environment}.`,
	);
	context.log.dim(`Command: ${command.join(" ")}`);
	context.debug.debug("run:start", "Running command with Fatima environment", {
		command: command.join(" "),
		stdio: options?.stdio ?? "inherit",
		environment: context.result.environment,
	});
	const exitCode = await runCommand(command, {
		debug: context.debug,
		env: context.result.env,
		stdio: options?.stdio,
	});
	context.debug.debug("run:done", "Command finished", {
		exitCode,
		environment: context.result.environment,
	});

	return {
		...context.result,
		exitCode,
	};
}
