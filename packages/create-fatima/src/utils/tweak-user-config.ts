import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

	return path.join(process.cwd(), filename);
}

export function tweakUserConfig(
	fileName: string,
	modifier: (config: AnyType) => AnyType,
): AnyType {
	const filePath = getConfigPath(fileName);

	let updatedFile = "";

	if (!filePath) return;

	try {
		const fileExtension = path.extname(fileName);

		switch (fileExtension) {
			case ".json": {
				if (!existsSync(filePath)) {
					writeFileSync(filePath, "{}");
				}

				const fileContent = readFileSync(filePath, "utf8");

				const config = parse(fileContent, null, false);

				const changed = assign(config, modifier(config));

				const newContent = stringify(changed, null, 2);

				updatedFile = newContent;

				break;
			}
			default: {
				if (!existsSync(filePath)) {
					writeFileSync(filePath, "");
				}

				const currentContent = readFileSync(filePath, "utf8");

				const newContent = modifier(currentContent);

				if (!newContent) return;

				updatedFile = newContent;

				break;
			}
		}
	} catch (e) {
		console.error(`Error reading ${fileName}:`, e);
		return;
	}

	console.log(
		`Tweaked ${filePath} with the following changes:\n${updatedFile}`,
	);

	writeFileSync(filePath, updatedFile);
}
