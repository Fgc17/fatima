import fs from "node:fs";
import path from "node:path";
import { jsonSafeParse } from "lib/utils/json";

export const getTsconfigAliases = (): Record<string, string> => {
	const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");

	const { json, error } = jsonSafeParse(fs.readFileSync(tsconfigPath, "utf8"));

	if (error) {
		throw new Error("Failed to parse tsconfig.json", {
			cause: error,
		});
	}

	const basePath = path.dirname(tsconfigPath);
	const paths = (json.compilerOptions?.paths ?? {}) as Record<string, string[]>;

	const aliases: Record<string, string> = {};
	for (const [alias, values] of Object.entries(paths)) {
		const resolvedPaths = values.map((p: string) =>
			path.resolve(basePath, p.replace(/\/\*$/, "")),
		);
		aliases[alias.replace(/\/\*$/, "")] = resolvedPaths[0];
	}

	return aliases;
};
