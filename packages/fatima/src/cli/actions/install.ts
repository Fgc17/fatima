import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createAction } from "../utils/create-action";

const LOCK_FILE_NAMES = {
	npm: "package-lock.json",
	pnpm: "pnpm-lock.yaml",
	yarn: "yarn.lock",
	bun: "bun.lockb",
};

type PackageManager = keyof typeof LOCK_FILE_NAMES;

const getPackageManager = (): {
	manager: PackageManager;
	hasLockFile: boolean;
} => {
	const userAgent = process.env.npm_config_user_agent;

	if (!userAgent) {
		console.warn(
			"Warning: Could not determine npm_config_user_agent. Defaulting to npm.",
		);
		return { manager: "npm", hasLockFile: checkLockFile("npm") };
	}

	const manager = detectPackageManager(userAgent);

	return { manager, hasLockFile: checkLockFile(manager) };
};

const detectPackageManager = (userAgent: string): PackageManager => {
	if (userAgent.includes("pnpm")) {
		return "pnpm";
	}
	if (userAgent.includes("yarn")) {
		return "yarn";
	}
	if (userAgent.includes("bun")) {
		return "bun";
	}
	return "npm";
};

const checkLockFile = (manager: PackageManager): boolean => {
	const lockFileName = LOCK_FILE_NAMES[manager];
	return existsSync(resolve(process.cwd(), lockFileName));
};

const getInstallArgs = (manager: PackageManager): string[] => {
	const devPackageName = "fatima@latest";
	const runtimePackageName = "@fatimajs/tools@latest";
	const devFlag = manager === "bun" ? "-d" : "-D";

	switch (manager) {
		case "yarn":
		case "pnpm":
		case "bun":
			return ["add", devFlag, devPackageName, runtimePackageName];
		case "npm":
			return ["install", devFlag, devPackageName, runtimePackageName];
		default:
			console.error(`Error: Unknown package manager: ${manager}`);
			return [];
	}
};

const installService = () => {
	const { manager } = getPackageManager();
	const args = getInstallArgs(manager);
	const dependencyTypes = "fatima (as dev) and @fatimajs/tools (as runtime)";

	if (args.length === 0) {
		console.warn("No install arguments generated. Skipping installation.");
		return;
	}

	const installProcess = spawn(manager, args, {
		stdio: "inherit",
		shell: false,
	});

	installProcess.on("close", (code) => {
		if (code !== 0) {
			console.error(
				`Error installing ${dependencyTypes} with ${manager}: process exited with code ${code}`,
			);
			return;
		}
		console.log("Packages installed successfully!");
	});

	installProcess.on("error", (err) => {
		console.error(
			`Failed to start child process for ${dependencyTypes} install with ${manager}.`,
			err,
		);
	});
};

export const installAction = createAction(installService, false);
