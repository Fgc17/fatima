import type {
	NormalizedFatimaConfig,
	UnsafeEnvironmentVariables,
} from "../config/types";
import type { FatimaDebugLogger } from "../lib/debug";
import { FatimaError } from "../lib/error";
import type { FatimaRegistry } from "../plugins/registry";

function getModelArgs(modelConfig: unknown): Record<string, unknown> {
	return modelConfig &&
		typeof modelConfig === "object" &&
		(modelConfig as { args?: unknown }).args &&
		typeof (modelConfig as { args?: unknown }).args === "object" &&
		!Array.isArray((modelConfig as { args?: unknown }).args)
		? (modelConfig as { args: Record<string, unknown> }).args
		: {};
}

function parseModelValue(
	modelName: string,
	value: string | undefined,
): unknown {
	if (value == null) {
		return value;
	}

	if (modelName === "number" || modelName === "integer") {
		return Number(value);
	}

	if (modelName === "boolean") {
		const normalized = value.toLowerCase();
		if (["true", "1", "yes", "on", "y", "enabled"].includes(normalized))
			return true;
		if (["false", "0", "no", "off", "n", "disabled"].includes(normalized))
			return false;
	}

	return value;
}

function validateAllowedValues(
	modelName: string,
	value: string | undefined,
	args: Record<string, unknown>,
) {
	if (!Array.isArray(args.values)) {
		return;
	}

	const parsed = parseModelValue(modelName, value);
	if (!args.values.includes(parsed)) {
		return `Expected one of: ${args.values.join(", ")}`;
	}
}

export async function validateEnvironment(
	config: NormalizedFatimaConfig,
	registry: FatimaRegistry,
	env: UnsafeEnvironmentVariables,
	options?: { debug?: FatimaDebugLogger },
): Promise<void> {
	options?.debug?.debug("validate:run", "Running model validation", {
		variableCount: Object.keys(env).length,
		hasSchema: Boolean(config.model),
	});

	if (!config.model) {
		throw new FatimaError(
			"No model defined in fatima.json. Add `model` to use this command.",
		);
	}

	const grouped: Record<string, string[]> = {};

	for (const [key, modelConfig] of Object.entries(config.model)) {
		const modelName =
			typeof modelConfig === "string" ? modelConfig : modelConfig.type;
		const modelArgs = getModelArgs(modelConfig);
		const model = registry.models[modelName];

		if (!model) {
			throw new FatimaError(`Unknown Fatima model: ${modelName}`);
		}

		if (!model.validate) {
			continue;
		}

		const message = await model.validate(env[key], {
			key,
			env,
			config: modelArgs,
		});

		if (message) {
			grouped[key] ??= [];
			grouped[key].push(message);
		}

		const valuesMessage = validateAllowedValues(modelName, env[key], modelArgs);
		if (valuesMessage) {
			grouped[key] ??= [];
			grouped[key].push(valuesMessage);
		}
	}

	if (Object.keys(grouped).length === 0) {
		options?.debug?.debug("validate:success", "Model validation succeeded");
		return;
	}

	options?.debug?.debug("validate:failure", "Model validation failed", {
		issueCount: Object.keys(grouped).length,
	});

	const message = Object.entries(grouped)
		.map(
			([key, messages]) =>
				`${key}\n${messages.map((item) => `- ${item}`).join("\n")}`,
		)
		.join("\n\n");

	throw new FatimaError(`Environment validation failed.\n\n${message}`);
}
