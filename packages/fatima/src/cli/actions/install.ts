import { debug, fatimaStore, logger } from "@fatimajs/tools/lib";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const lockfiles = {
	npm: "package-lock.json",
	pnpm: "pnpm-lock.yaml",
	yarn: "yarn.lock",
	bun: "bun.lockb",
};

type PackageManager = keyof typeof lockfiles;

type DependencyType = "dev" | "runtime";

const resolveManagerFromAgent = (): PackageManager => {
	const userAgent = process.env.npm_config_user_agent;

	if (userAgent?.includes("pnpm")) {
		return "pnpm";
	}

	if (userAgent?.includes("yarn")) {
		return "yarn";
	}

	if (userAgent?.includes("bun")) {
		return "bun";
	}

	return "npm";
};

const resolveManagerFromLock = () => {
	for (const [manager, name] of Object.entries(lockfiles)) {
		if (existsSync(resolve(process.cwd(), name))) {
			return manager as PackageManager;
		}
	}
};

const detectPackageManager = (): PackageManager => {
	const managerFromLock = resolveManagerFromLock();

	if (managerFromLock) {
		return managerFromLock;
	}

	return resolveManagerFromAgent();
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

const isTypescriptProject = (): boolean => {
	const tsConfigPath = resolve(process.cwd(), "tsconfig.json");
	return existsSync(tsConfigPath);
};

const installService = () => {
	fatimaStore.set("environment", "installation");

	const manager = detectPackageManager();

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

	const devDependencies = ["fatima@latest"];

	if (isTypescriptProject()) {
		devDependencies.push("jiti@2.4.2");
	}

	const installDevDependencies = () =>
		installDependency(devDependencies, "dev", "fatima (as dev)");

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
