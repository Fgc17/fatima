#!/usr/bin/env bun

import { cp, mkdir, rm } from "node:fs/promises";
import { $ } from "bun";

const moduleEntries = [
	["api", "src/exports/api.ts"],
	["cli", "src/exports/cli.ts"],
	["eslint", "src/exports/eslint.ts"],
	["plugin", "src/exports/plugin.ts"],
	["register", "src/exports/register.ts"],
	["runtime", "src/exports/runtime.ts"],
] as const;

async function buildModule(name: string, entrypoint: string) {
	const result = await Bun.build({
		entrypoints: [entrypoint],
		outdir: "dist",
		naming: {
			entry: `${name}.js`,
		},
		target: "node",
		format: "esm",
		sourcemap: "none",
		packages: "external",
	});

	if (!result.success) {
		for (const log of result.logs) {
			console.error(log);
		}
		throw new Error(`Failed to build ${name}`);
	}
}

async function buildCliBinary() {
	const result = await Bun.build({
		entrypoints: ["src/exports/cli.ts"],
		target: "bun",
		compile: {
			outfile: "dist/fatima",
			autoloadDotenv: false,
			autoloadBunfig: false,
			autoloadTsconfig: true,
			autoloadPackageJson: true,
		},
	});

	if (!result.success) {
		for (const log of result.logs) {
			console.error(log);
		}
		throw new Error("Failed to build Fatima binary");
	}
}

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await Promise.all(
	moduleEntries.map(([name, entrypoint]) => buildModule(name, entrypoint)),
);

await buildCliBinary();
await cp("src/plugins/biome.grit", "dist/biome.grit");

await $`tsc -p tsconfig.build.json --declaration --emitDeclarationOnly --noEmit false --outDir dist/types --declarationMap false`;
