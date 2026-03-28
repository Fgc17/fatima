import type { FatimaConfig } from "../config";
import type { UnsafeEnvironmentVariables } from "../config/types";
import type { FatimaDebugLogger } from "../lib/debug";
import { FatimaError } from "../lib/error";
import type { StandardSchemaV1 } from "../lib/standard-schema";

function getIssuePath(issue: StandardSchemaV1.Issue): string {
	if (!issue.path?.length) {
		return "root";
	}

	return issue.path
		.map((segment) =>
			typeof segment === "object" && "key" in segment
				? String(segment.key)
				: String(segment),
		)
		.join(".");
}

export async function validateEnvironment(
	config: FatimaConfig,
	env: UnsafeEnvironmentVariables,
	options?: { debug?: FatimaDebugLogger },
): Promise<void> {
	options?.debug?.debug("validate:run", "Running schema validation", {
		variableCount: Object.keys(env).length,
		hasSchema: Boolean(config.schema),
	});

	if (!config.schema) {
		throw new FatimaError(
			"No schema defined in env.config.*. Add `schema` to use this command.",
		);
	}

	const result = await config.schema["~standard"].validate(env);

	if (!result.issues?.length) {
		options?.debug?.debug("validate:success", "Schema validation succeeded");
		return;
	}

	options?.debug?.debug("validate:failure", "Schema validation failed", {
		issueCount: result.issues.length,
	});

	const grouped = result.issues.reduce<Record<string, string[]>>(
		(acc, issue) => {
			const key = getIssuePath(issue);
			acc[key] ??= [];
			acc[key].push(issue.message);
			return acc;
		},
		{},
	);

	const message = Object.entries(grouped)
		.map(
			([key, messages]) =>
				`${key}\n${messages.map((item) => `- ${item}`).join("\n")}`,
		)
		.join("\n\n");

	throw new FatimaError(`Environment validation failed.\n\n${message}`);
}
