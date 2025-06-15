import path from "node:path";
import fs from "node:fs";

export const getTsconfigAliases = (): Record<string, string> => {
	const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");

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
