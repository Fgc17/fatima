import type { Any } from "./types";

declare const Bun: Any;
declare const Deno: Any;

export const getRuntime = () => {
	let runtime = "" as "node" | "bun" | "deno";

	if (process.release.name === "node") {
		runtime = "node";
	}

	if (typeof Bun !== "undefined") {
		runtime = "bun";
	}

	if (typeof Deno !== "undefined") {
		runtime = "deno";
	}

	const supportedRuntimes = ["node", "bun"];

	if (!supportedRuntimes.includes(runtime)) {
		throw new Error(`Unsupported runtime: ${runtime}`);
	}

	return runtime;
};
