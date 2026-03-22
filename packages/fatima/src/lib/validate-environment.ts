import type { FatimaConfig } from "../core/config";
import { FatimaError } from "./errors";
import type { StandardSchemaV1 } from "./standard-schema/standard-schema";
import type { UnsafeEnvironmentVariables } from "./types";

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
): Promise<void> {
	if (!config.validate) {
		throw new FatimaError(
			"No schema defined in env.config.*. Add `validate: schema` to use this command.",
		);
	}

	const result = await config.validate["~standard"].validate(env);

	if (!result.issues?.length) {
		return;
	}

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
