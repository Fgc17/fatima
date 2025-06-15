import { writeFileSync } from "node:fs";
import path from "node:path";
import type { FatimaConfig } from "lib/config";
import { getConfigLanguage } from "lib/config/config-language";
import type { UnsafeEnvironmentVariables } from "lib/types";
import { format } from "lib/utils/format";
import { content } from "./content";

export async function generateClient(
	config: FatimaConfig,
	env: UnsafeEnvironmentVariables,
) {
	const clientPath = path.resolve(
		config.file.folderPath,
		`env${config.file.extension}`,
	);

	const { module, lang } = getConfigLanguage(config.file.path);

	const createEnvArg = `{ isServer: ${config.client?.isServer?.toString() ?? "undefined"} }`;

	const clientContent = content({
		createEnvArg,
		publicPrefix: config.client?.publicPrefix ?? "PUBLIC_",
		lang,
		module,
		env,
	});

	const formattedContent = await format(clientContent.join("\n"));

	writeFileSync(clientPath, formattedContent);
}
