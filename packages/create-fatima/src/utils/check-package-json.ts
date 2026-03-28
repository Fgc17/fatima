import { existsSync } from "node:fs";
import path from "node:path";

export function checkPackageJson() {
	const currentDir = process.cwd();

	if (!existsSync(path.join(currentDir, "package.json"))) {
		throw new Error(
			"'fatima init' must be executed in a directory with a package.json file.",
		);
	}
}
