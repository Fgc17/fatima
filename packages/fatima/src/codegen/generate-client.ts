import { writeFileSync } from "node:fs";
import path from "node:path";
import type { FatimaConfig } from "../config";
import type { UnsafeEnvironmentVariables } from "../config/types";
import type { FatimaDebugLogger } from "../lib/debug";
import { format } from "../lib/format";
import { renderClient } from "./render-client";

export async function generateClient(
	config: FatimaConfig,
	env: UnsafeEnvironmentVariables,
	debug?: FatimaDebugLogger,
) {
	const clientPath = path.resolve(
		config.file.folderPath,
		`env${config.file.extension}`,
	);
	debug?.debug("generate:render", "Rendering client content", {
		outputPath: clientPath,
		loadedVariableCount: Object.keys(env).length,
		publicPrefix: config.client?.publicPrefix ?? "PUBLIC_",
	});

	const createEnvArg = `{ isServer: ${config.client?.isServer?.toString() ?? "undefined"} }`;

	const configPath = config.file.path;

	const publicPrefix = config.client?.publicPrefix ?? "PUBLIC_";

	const clientContent = renderClient({
		createEnvArg,
		publicPrefix,
		env,
		configPath,
		hasSchema: Boolean(config.schema),
	});

	const formattedContent = await format(clientContent.join("\n"));
	debug?.debug("generate:write", "Writing generated client file", {
		outputPath: clientPath,
	});

	writeFileSync(clientPath, formattedContent);

	return clientPath;
}
