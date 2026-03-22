import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnvLines } from "../../lib/env/parse-env";
import type { FatimaProvider } from "../../lib/types";

export type LocalProviderConfig = string | string[];

export const local = (config: LocalProviderConfig): FatimaProvider => {
	const files = Array.isArray(config) ? config : [config];

	return {
		fetch() {
			const env = {} as Record<string, string>;

			for (const file of files) {
				const resolvedPath = resolve(process.cwd(), file);
				const content = readFileSync(resolvedPath, "utf8");
				Object.assign(env, parseEnvLines(content));
			}

			return env;
		},
	};
};
