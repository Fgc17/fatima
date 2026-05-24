import type {
	NormalizedFatimaConfig,
	UnsafeEnvironmentVariables,
} from "../config/types";
import type { FatimaDebugLogger } from "../lib/debug";
import { FatimaError } from "../lib/error";
import type { FatimaRegistry } from "../plugins/registry";

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
			config: modelConfig,
		});

		if (message) {
			grouped[key] ??= [];
			grouped[key].push(message);
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
