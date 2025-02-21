// Special thanks to motdotla (dotenv) for the regex pattern and how to parse env lines.

import { ENVLINE } from "../constants/envline";

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

export function parseEnvLines(lines: string) {
	const env = {} as Record<string, string>;

	const lineList = lines.replace(/\r\n?/gm, "\n").split("\n");

	for (const line of lineList) {
		const match = ENVLINE.exec(line);

		if (!match) {
			continue;
		}

		const [_, envKey, envValue] = match;

		env[envKey] = normalizeEnvValue(envValue);

		ENVLINE.lastIndex = 0;
	}

	return env;
}
