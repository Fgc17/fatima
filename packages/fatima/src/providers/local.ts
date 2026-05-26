import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnvLines } from "../env/parse-env";
import type { FatimaProvider, FatimaProviderFactory } from "../plugins/types";

export type LocalProviderConfig = {
	file?: string | string[];
	files?: string[];
};

export const local: FatimaProviderFactory<
	LocalProviderConfig | string | string[]
> = (config): FatimaProvider => {
	const files = Array.isArray(config)
		? config
		: typeof config === "string"
			? [config]
			: Array.isArray(config.files)
				? config.files
				: Array.isArray(config.file)
					? config.file
					: [config.file ?? ".env"];

	return {
		fetch(context) {
			const env = {} as Record<string, string>;

			for (const file of files) {
				const resolvedPath = resolve(context.cwd, file);
				const content = readFileSync(resolvedPath, "utf8");
				Object.assign(env, parseEnvLines(content));
			}

			return env;
		},
	};
};
