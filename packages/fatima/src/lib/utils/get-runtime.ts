import type { AnyType } from "@fatimajs/tools/lib";

declare const Bun: AnyType;
declare const Deno: AnyType;

export const getRuntime = () => {
	let runtime = "";

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
