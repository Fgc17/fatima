import type { FatimaConfig } from "src/core/config";
import type { UnsafeEnvironmentVariables } from "src/core/types";
import { getTypescriptClient } from "./typescript-client";
import { getJavascriptClient } from "./javascript-client";
import { writeFileSync } from "node:fs";
import path from "node:path";

export function createClient(
	config: FatimaConfig,
	env: UnsafeEnvironmentVariables,
) {
	const clientPath = path.resolve(
		config.file.folderPath,
		`env${config.file.extension}`,
	);

	const envs = Object.keys(env ?? {});

	const isTypescript = config.file.path.endsWith("ts");

	const client = isTypescript
		? getTypescriptClient(envs, config.client)
		: getJavascriptClient(envs, config.client);

	writeFileSync(clientPath, client);
}
