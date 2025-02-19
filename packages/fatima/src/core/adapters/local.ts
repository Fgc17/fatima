import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnvFile } from "src/lib/env/parse-env";

const load =
	(...files: string[]) =>
	async () => {
		const base = process.cwd();

		const envPaths = files.map((file) => resolve(base, file));

		const envContents = await Promise.all(
			envPaths.map(async (envPath) => {
				try {
					const file = readFileSync(envPath);

					const content = file.toString("utf-8");

					const env = parseEnvFile(content);

					return env;
				} catch (error) {
					return {};
				}
			}),
		);

		let env = {};

		for (const content of envContents) {
			env = { ...env, ...content };
		}

		return env;
	};

export const local = {
	load,
};
