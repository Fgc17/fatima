import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assign, parse, stringify } from "comment-json";

type UnknownObject = Record<string, any>;

type JsonValue = UnknownObject & {
	compilerOptions?: UnknownObject;
	imports?: Record<string, string>;
};

function getConfigPath(fileName: string) {
	return path.join(process.cwd(), fileName);
}

export function checkPackageJson() {
	const currentDir = process.cwd();

	if (!existsSync(path.join(currentDir, "package.json"))) {
		throw new Error(
			"'fatima init' must be executed in a directory with a package.json file.",
		);
	}
}

export function tweakJsonConfig(
	fileName: `${string}.json`,
	modifier: (config: JsonValue) => JsonValue | null | undefined,
): void {
	const filePath = getConfigPath(fileName);

	if (!existsSync(filePath)) {
		writeFileSync(filePath, "{}", "utf8");
	}

	const fileContent = readFileSync(filePath, "utf8");
	const config = parse(fileContent, null, false) as JsonValue;
	const nextConfig = modifier(config);

	if (!nextConfig) return;

	const changed = assign(config, nextConfig);
	const newContent = stringify(changed, null, 2);

	writeFileSync(filePath, newContent, "utf8");
}

export function tweakTextFile(
	fileName: string,
	modifier: (content: string) => string | null | undefined,
): void {
	const filePath = getConfigPath(fileName);

	if (!existsSync(filePath)) {
		writeFileSync(filePath, "", "utf8");
	}

	const currentContent = readFileSync(filePath, "utf8");
	const newContent = modifier(currentContent);

	if (!newContent) return;

	writeFileSync(filePath, newContent, "utf8");
}

export function findNestedPackage(directory = process.cwd()): boolean {
	function search(dir: string, isRoot = true): boolean {
		const dirEntries = readdirSync(dir, { withFileTypes: true });

		return dirEntries.some((entry) => {
			if (entry.name === "node_modules" || entry.name.startsWith(".")) {
				return false;
			}
			if (entry.name === "package.json" && !isRoot) {
				return true;
			}
			if (entry.isDirectory()) {
				return search(path.resolve(dir, entry.name), false);
			}
			return false;
		});
	}

	return search(directory);
}
