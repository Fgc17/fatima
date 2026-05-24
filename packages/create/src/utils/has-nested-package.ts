import fs from "node:fs";
import path from "node:path";

export function findNestedPackage(directory = process.cwd()): boolean {
	function search(dir: string, isRoot = true): boolean {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		return entries.some((entry) => {
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
