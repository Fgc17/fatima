import {
	existsSync,
	readFileSync,
	appendFileSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import type { AnyType } from "../lib/types";
import { parse, stringify, assign } from "comment-json";

function getConfigPath(filename: string): string | null {
	let currentDir = process.cwd();

	while (currentDir !== path.parse(currentDir).root) {
		const configPath = path.join(currentDir, filename);
		if (existsSync(configPath)) {
			return configPath;
		}
		currentDir = path.dirname(currentDir);
	}

	return null;
}

export function tweakUserConfig(
	fileName: string,
	modifier: (config: AnyType) => AnyType,
): AnyType {
	const filePath = getConfigPath(fileName);
	let updatedFile = "";

	if (!filePath) return;

	try {
		if (fileName.endsWith(".json")) {
			if (!existsSync(filePath)) {
				writeFileSync(filePath, "{}");
			}

			const fileContent = readFileSync(filePath, "utf8");

			const config = parse(fileContent, null, false);

			const changed = assign(config, modifier(config));

			const newContent = stringify(changed, null, 2);

			updatedFile = newContent;
		}

		if (!existsSync(filePath)) {
			writeFileSync(filePath, "");
		}

		const currentContent = readFileSync(filePath, "utf8");

		const newContent = modifier(currentContent);

		if (!newContent) return;

		updatedFile = newContent;
	} catch (e) {
		console.error(`Error reading ${fileName}:`, e);
		return;
	}

	writeFileSync(filePath, updatedFile);
}
