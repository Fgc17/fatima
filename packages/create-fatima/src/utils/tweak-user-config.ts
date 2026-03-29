import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assign, parse, stringify } from "comment-json";
import type { UnknownObject } from "./types";

type JsonValue = UnknownObject & {
	compilerOptions?: UnknownObject;
	imports?: Record<string, string>;
};

function getConfigPath(fileName: string) {
	return path.join(process.cwd(), fileName);
}

export function tweakJsonConfig(
	fileName: `${string}.json`,
	modifier: (config: JsonValue) => JsonValue | null | void,
): void {
	const filePath = getConfigPath(fileName);

	try {
		if (!existsSync(filePath)) {
			writeFileSync(filePath, "{}");
		}

		const fileContent = readFileSync(filePath, "utf8");
		const config = parse(fileContent, null, false) as JsonValue;
		const nextConfig = modifier(config);

		if (!nextConfig) return;

		const changed = assign(config, nextConfig);
		const newContent = stringify(changed, null, 2);

		writeFileSync(filePath, newContent);
	} catch (e) {
		console.error(`Error reading ${fileName}:`, e);
	}
}

export function tweakTextFile(
	fileName: string,
	modifier: (content: string) => string | null | void,
): void {
	const filePath = getConfigPath(fileName);

	try {
		if (!existsSync(filePath)) {
			writeFileSync(filePath, "");
		}

		const currentContent = readFileSync(filePath, "utf8");
		const newContent = modifier(currentContent);

		if (!newContent) return;

		writeFileSync(filePath, newContent);
	} catch (e) {
		console.error(`Error reading ${fileName}:`, e);
	}
}
