import chalk from "chalk";
import logSymbols from "log-symbols";
import type { Language } from "src/lib/types";
import {
	getPackageManager,
	getPackageManagerInstall,
} from "./get-package-manager";

export const summary = async (language: Language, modules: string[]) => {
	const ext = language === "typescript" ? "ts" : "js";
	const alias =
		language === "typescript"
			? "'tsconfig.json'"
			: "'jsconfig.json' and 'package.json'";

	const packageManager = getPackageManager();
	const packageManagerInstall = getPackageManagerInstall(packageManager);

	const configFile = `env.config.${ext}`;
	const envFile = `env.${ext}`;

	const message = [
		logSymbols.success + chalk.bold(" Done! 🎉"),
		logSymbols.warning + chalk.bold(" Here's a summary of what happened:"),
		`   ↪ Created '${configFile}'`,
		"   ↪ Added path alias to " + alias,
		`   ↪ Added '${envFile}' to '.gitignore'`,
		logSymbols.info + chalk.bold(" Next steps:"),
		modules.length &&
			`   ↪ Install dependencies: ${packageManagerInstall} ${modules.join(" ")}`,
		"   ↪ Make it typesafe: 'fatima generate'",
		"   ↪ Setup your dev script: 'fatima dev -- npm dev'",
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
