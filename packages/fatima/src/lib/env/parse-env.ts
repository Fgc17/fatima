// Special thanks to motdotla and the 'dotenv' package for:
// - regex pattern
// - how to parse env files

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

export function parseEnvFile(src: string) {
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
