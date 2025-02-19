import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envLineRegex =
	/(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

const normalizeEnvValue = (value = "") => {
	let normalizedValue = value;

	normalizedValue = normalizedValue.trim();

	normalizedValue = normalizedValue.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");

	const isDoubleQuoted = value[0] === '"';

	if (isDoubleQuoted) {
		normalizedValue = normalizedValue.replace(/\\n/g, "\n");
		normalizedValue = normalizedValue.replace(/\\r/g, "\r");
	}

	return normalizedValue;
};

function envFileToObject(src: string) {
	const env = {} as Record<string, string>;

	const lines = src.replace(/\r\n?/gm, "\n").split("\n");

	for (const line of lines) {
		const match = envLineRegex.exec(line);

		if (!match) {
			continue;
		}

		const envKey = match[1];

		const envValue = normalizeEnvValue(match[2]);

		env[envKey] = envValue;
	}

	return env;
}

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

					const env = envFileToObject(content);

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
