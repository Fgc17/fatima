import type { FatimaConfig } from "lib/config";
import type { UnsafeEnvironmentVariables } from "@fatimajs/tools/lib";
import { getTypescriptClient } from "./typescript-client";
import { getJavascriptClient } from "./javascript-client";
import { writeFileSync } from "node:fs";
import { isTypescriptFile } from "lib/utils/is-typescript";
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

	const client = isTypescriptFile(config.file.path)
		? getTypescriptClient(envs, config.client)
		: getJavascriptClient(envs, config.client);

	writeFileSync(clientPath, client);
}
