import { existsSync } from "node:fs";
import chalk from "chalk";
import path from "node:path";

export function checkPackageJson() {
	const currentDir = process.cwd();

	if (!existsSync(path.join(currentDir, "package.json"))) {
		console.log(
			chalk.red(
				"'fatima init' must be executed in a directory with a package.json file.",
			),
		);

		process.exit(1);
	}
}
