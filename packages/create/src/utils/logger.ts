import chalk from "chalk";
import logSymbols from "log-symbols";
import type { Generator } from "../lib/types";
import {
	getPackageManager,
	getPackageManagerInstall,
} from "./get-package-manager";

export const summary = async (generator: Generator, modules: string[]) => {
	const ext =
		generator === "typescript"
			? "ts"
			: generator === "python"
				? "py"
				: "js";
	const alias =
		generator === "typescript"
			? "'tsconfig.json'"
			: generator === "javascript"
				? "'jsconfig.json' and 'package.json'"
				: null;

	const packageManager = getPackageManager();
	const packageManagerInstall = getPackageManagerInstall(packageManager);

	const configFile = "fatima.json";
	const envFile = `env.${ext}`;

	const message = [
		logSymbols.success + chalk.bold(" Done! 🎉"),
		logSymbols.warning + chalk.bold(" Here's a summary of what happened:"),
		`   ↪ Created '${configFile}'`,
		alias && "   ↪ Added path alias to " + alias,
		`   ↪ Added '${envFile}' to '.gitignore'`,
		logSymbols.info + chalk.bold(" Next steps:"),
		modules.length &&
			`   ↪ Install dependencies: ${packageManagerInstall} ${modules.join(" ")}`,
		"   ↪ Make it typesafe: 'fatima generate'",
		"   ↪ In development, call 'registerAsync()' from 'fatima/register' before booting your app'",
		chalk.bold(
			"   ↪ Check out docs for much more: https://fatimajs.vercel.app/docs",
		),
		"Happy coding! 🚀",
	].filter(Boolean);

	return console.log(message.map((x) => `\r${x}`).join("\n"));
};

export const logger = {
	summary,
};
