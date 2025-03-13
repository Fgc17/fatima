import type { FatimaConfig } from "lib/config";
import type { UnsafeEnvironmentVariables } from "lib/types";
import { writeFileSync } from "node:fs";
import { client } from "./client";
import { getConfigLanguage } from "lib/config/config-language";
import path from "node:path";
import * as prettier from "prettier";

const format = async (content: string) => {
	return await prettier.format(content, {
		parser: "typescript",
	});
};

export async function generateClient(
	config: FatimaConfig,
	env: UnsafeEnvironmentVariables,
) {
	const clientPath = path.resolve(
		config.file.folderPath,
		`env${config.file.extension}`,
	);

	const envs = Object.keys(env ?? {});

	const { module, lang } = getConfigLanguage(config.file.path);

	const clientContent = client(envs, {
		lang,
		module,
		...config.client,
	});

	writeFileSync(clientPath, await format(clientContent.join("\n")));
}
