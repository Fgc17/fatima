import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnvLines } from "lib/env/parse-env";
import type { FatimaBuiltInLoadFunction } from "lib/types";

const parse = parseEnvLines;

const load =
	(...files: string[]): FatimaBuiltInLoadFunction =>
	() => {
		const base = process.cwd();

		const envPaths = files.map((file) => resolve(base, file));

		const envContents = envPaths.map((envPath) => {
			try {
				const file = readFileSync(envPath);

				const content = file.toString("utf-8");

				const env = parseEnvLines(content);

				return env;
			} catch (error) {
				return {};
			}
		});

		let env = {};

		for (const content of envContents) {
			env = { ...env, ...content };
		}

		return env;
	};

export const local = {
	load,
	parse,
};
