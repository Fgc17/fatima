import type { Plugin, PluginBuild } from "esbuild";
import type { AnyType } from "lib/types";
import fs from "node:fs";
import path from "node:path";

export interface RawImportConfig {
	extensions?: string[];
	textExtensions?: string[];
	loader?: "text" | "base64" | "dataurl" | "file" | "binary" | "default";
}

export function rawImportPlugin(config: RawImportConfig = {}) {
	const extList = config.extensions ?? [
		"ts",
		"tsx",
		"js",
		"jsx",
		"mjs",
		"mts",
		"module.css",
		"module.scss",
		"css",
		"scss",
		"d.ts",
	];
	const specifiedLoader = config.loader;
	const textExts = config.textExtensions ?? [];

	const plugin: Plugin = {
		name: "raw-import-plugin",
		setup(builder: PluginBuild) {
			builder.onResolve({ filter: /\?raw$/ }, (resolveArgs) => {
				const rawPath = resolveArgs.path.replace(/\?raw$/, "");
				const absolutePath = path.resolve(resolveArgs.resolveDir, rawPath);
				return {
					path: resolveArgs.path,
					pluginData: { targetPath: absolutePath },
					namespace: "raw-content",
				};
			});

			builder.onLoad(
				{ filter: /\?raw$/, namespace: "raw-content" },
				(loadArgs) => {
					const { targetPath } = loadArgs.pluginData as { targetPath: string };

					if (specifiedLoader && specifiedLoader !== "text") {
						if (!fs.existsSync(targetPath)) {
							throw new Error(`Cannot locate file: ${targetPath}`);
						}
						const fileContent = fs.readFileSync(targetPath, "utf8");
						return { contents: fileContent, loader: specifiedLoader };
					}

					let finalPath = targetPath;
					const stat = fs.existsSync(finalPath)
						? fs.lstatSync(finalPath)
						: null;
					if (stat?.isDirectory()) {
						finalPath = path.join(finalPath, "index");
					}

					if (!fs.existsSync(finalPath)) {
						let found = false;
						for (const ext of extList) {
							const testPath = `${finalPath}.${ext}`;
							if (fs.existsSync(testPath)) {
								finalPath = testPath;
								found = true;
								break;
							}
						}
						if (!found) {
							throw new Error(
								`No matching file found for: ${targetPath}\nTried extensions: ${extList.join(", ")}`,
							);
						}
					}

					const fileContent = fs.readFileSync(finalPath, "utf8");
					return { contents: fileContent, loader: "text" };
				},
			);

			if (textExts.length > 0) {
				const textPattern = new RegExp(
					`\\.(${textExts.map((ext) => ext.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`,
				);
				builder.onLoad({ filter: textPattern }, (loadArgs) => {
					const fileContent = fs.readFileSync(loadArgs.path, "utf8");
					return { contents: fileContent, loader: "text" };
				});
			}
		},
	};

	return plugin as AnyType;
}
