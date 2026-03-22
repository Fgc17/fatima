import { writeFileSync } from "node:fs";
import path from "node:path";
import type { FatimaConfig } from "../../core/config";
import type { UnsafeEnvironmentVariables } from "../types";
import { format } from "../utils/format";
import { content } from "./content";

export async function generateClient(
	config: FatimaConfig,
	env: UnsafeEnvironmentVariables,
) {
	const clientPath = path.resolve(
		config.file.folderPath,
		`env${config.file.extension}`,
	);

	const createEnvArg = `{ isServer: ${config.client?.isServer?.toString() ?? "undefined"} }`;

	const configPath = config.file.path;

	const publicPrefix = config.client?.publicPrefix ?? "PUBLIC_";

	const clientContent = content({
		createEnvArg,
		publicPrefix,
		env,
		hasValidator: Boolean(config.validate),
		configPath,
	});

	const formattedContent = await format(clientContent.join("\n"));

	writeFileSync(clientPath, formattedContent);

	return clientPath;
}
