import { existsSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";

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
