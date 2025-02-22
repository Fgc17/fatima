import { debug, fatimaStore, logger } from "@fatimajs/tools/lib";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const LOCK_FILE_NAMES = {
	npm: "package-lock.json",
	pnpm: "pnpm-lock.yaml",
	yarn: "yarn.lock",
	bun: "bun.lockb",
};

type PackageManager = keyof typeof LOCK_FILE_NAMES;

type DependencyType = "dev" | "runtime";

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

const getInstallArgs = (
	manager: PackageManager,
	packages: string | string[],
	type: DependencyType,
): string[] => {
	const devFlag = manager === "bun" ? "-d" : "-D";
	const installFlag = type === "dev" ? devFlag : "";
	const installCommand = manager === "npm" ? "install" : "add";

	const packageArray = Array.isArray(packages) ? packages : [packages];

	return [installCommand, installFlag, ...packageArray];
};

const installService = () => {
	fatimaStore.set("environment", "installation");

	const { manager } = getPackageManager();

	const installErrorMessage = (dependency: string, code: number | null) =>
		`Error installing ${dependency} with ${manager}: process exited with code ${code}`;

	const installDependency = (
		packages: string | string[],
		type: "dev" | "runtime",
		dependency: string,
	): Promise<void> => {
		const installArgs = getInstallArgs(manager, packages, type);

		if (installArgs.length === 0) {
			console.warn(
				`No install arguments generated for ${dependency}. Skipping installation.`,
			);
			return Promise.resolve();
		}

		return new Promise<void>((resolve, reject) => {
			const installProcess = spawn(manager, installArgs, {
				stdio: "inherit",
				shell: false,
			});

			installProcess.on("close", (code) => {
				if (code !== 0) {
					logger.error(installErrorMessage(dependency, code));
					reject(new Error(`Install process exited with code ${code}`));
					return;
				}
				resolve();
			});

			installProcess.on("error", (err) => {
				logger.error(installErrorMessage(dependency, null));
				reject(err);
			});
		});
	};

	const installDevDependencies = () =>
		installDependency("fatima@latest", "dev", "fatima (as dev)");

	const installRuntimeDependencies = () =>
		installDependency(
			"@fatimajs/tools@latest",
			"runtime",
			"@fatimajs/tools (as runtime)",
		);

	Promise.resolve()
		.then(installDevDependencies)
		.then(installRuntimeDependencies)
		.then(() => logger.success("🎉 Installation complete."))
		.catch((e) => {
			logger.error(
				"An error happened, sorry for the inconvenience 😔",
				"Alternatively, you can:",
				"	1. Install manually: 'npm install -D fatima && @fatimajs/tools'",
				"	2. Run with --debug flag and tell us on github about the error",
			);
			debug.error(e);
		});
};

export const installAction = installService;
