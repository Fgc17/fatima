type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export function getPackageManager() {
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
}

export function getPackageManagerInstall(packageManager: PackageManager) {
	if (packageManager === "pnpm") {
		return "pnpm i";
	}

	if (packageManager === "yarn") {
		return "yarn add";
	}

	if (packageManager === "bun") {
		return "bun i";
	}

	return "npm i";
}

export function getPackageManagerExec(packageManager: PackageManager) {
	if (packageManager === "pnpm") {
		return "pnpm";
	}

	if (packageManager === "yarn") {
		return "yarn";
	}

	if (packageManager === "bun") {
		return "bun";
	}

	return "npx";
}
