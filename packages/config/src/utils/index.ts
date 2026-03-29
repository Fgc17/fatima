import fs from "node:fs";
import path from "node:path";

export const getTsconfigAliases = (
	tsconfigPath: string,
): Record<string, string> => {
	const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
	const basePath = path.dirname(tsconfigPath);
	const paths = (tsconfig.compilerOptions?.paths ?? {}) as Record<
		string,
		string[]
	>;

	const aliases: Record<string, string> = {};
	for (const [alias, values] of Object.entries(paths)) {
		const resolvedPaths = values.map((p: string) =>
			path.resolve(basePath, p.replace(/\/\*$/, "")),
		);
		aliases[alias.replace(/\/\*$/, "")] = resolvedPaths[0];
	}

	return aliases;
};

export const findNearestTsconfig = (
	workspace: string,
	file: string,
): string | null => {
	let dir = path.dirname(file);
	while (dir.startsWith(workspace)) {
		const tsconfigPath = path.join(dir, "tsconfig.json");
		if (fs.existsSync(tsconfigPath)) {
			return tsconfigPath;
		}
		dir = path.dirname(dir);
	}

	return null;
};
