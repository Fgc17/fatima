import { runGenerator } from "../generators/run-generator";
import { hasConfigOverrides, resolveRuntimeConfig } from "../config/resolve-runtime-config";
import type { LoadedEnvironment } from "../env/load-env";
import { loadEnvironment } from "../env/load-env";
import { validateEnvironment } from "../env/validate-environment";
import { createDebugLogger } from "../lib/debug";
import { createLog } from "../lib/log";
import { runCommand } from "../lib/run-command";
import type { GenerateOptions, RunOptions, RuntimeConfigInput } from "./types";

export { register, registerAsync } from "./register";
export type { GenerateOptions, RunOptions, RuntimeConfigInput } from "./types";

type WorkflowContext = {
	config: Awaited<ReturnType<typeof resolveRuntimeConfig>>["config"];
	registry: Awaited<ReturnType<typeof resolveRuntimeConfig>>["registry"];
	debug: ReturnType<typeof createDebugLogger>;
	log: ReturnType<typeof createLog>;
	result: LoadedEnvironment;
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
		hasPublicPrefixOverride: Boolean(options?.publicPrefix),
		processEnv: Boolean(options?.processEnv),
	});

	const { config, registry } = await resolveRuntimeConfig(options, {
		requireConfig: settings?.requireConfig,
		debug,
	});

	const result = await loadEnvironment(config, registry, {
		environment: options?.environment,
		useProcessEnv: options?.processEnv,
		debug,
	});

	debug.debug("workflow:ready", "Fatima workflow context resolved", {
		environment: result.environment,
		providersUsed: result.providersUsed,
		loadedVariableCount: Object.keys(result.loadedEnv).length,
	});

	return { config, registry, debug, log, result };
}

export async function validate(options?: RuntimeConfigInput) {
	const context = await getWorkflowContext(options, { requireConfig: true });
	context.debug.debug("validate:start", "Validating environment", {
		environment: context.result.environment,
	});

	await validateEnvironment(context.config, context.registry, context.result.env, {
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
	const context = await getWorkflowContext(options, { requireConfig: true });

	if (hasConfigOverrides(options)) {
		context.debug.debug(
			"generate:override-config",
			"Using generate config overrides from CLI flags",
			{
				environment: context.result.environment,
				generator: context.config.generator,
				file: context.config.file,
				publicPrefix: options?.publicPrefix,
			},
		);
	}

	context.debug.debug("generate:start", "Generating client file", {
		environment: context.result.environment,
		strict: Boolean(options?.strict),
	});

	if (options?.strict && context.config.model) {
		context.debug.debug(
			"generate:strict-validate",
			"Running validation before code generation",
			{ environment: context.result.environment },
		);
		await validateEnvironment(context.config, context.registry, context.result.env, {
			debug: context.debug,
		});
	}

	const outputPath = await runGenerator(
		context.config,
		context.registry,
		context.result.environment,
		context.result.env,
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
	const context = await getWorkflowContext(options, { requireConfig: true });
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
