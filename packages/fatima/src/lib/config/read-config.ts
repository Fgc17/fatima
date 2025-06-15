import { createRequire } from "node:module";
import type { FatimaConfig } from "core/config";
import { getTsconfigAliases } from "lib/tsconfig/tsconfig";
import { wording } from "lib/wording";
import { isTypescriptFile } from "src/lib/utils/is-typescript";
import { isFatimaConfig } from "./utils";

const require = createRequire(import.meta.url);

export async function readConfig(configPath: string): Promise<FatimaConfig> {
	const originalEnv = { ...process.env };

	const isTypescript = isTypescriptFile(configPath);

	let config: FatimaConfig;

	if (!isTypescript) {
		config = require(configPath);
	} else {
		const plugins = [];
		try {
			const pluginPath = require.resolve(
				"@babel/plugin-transform-class-properties",
			);

			const pluginTransformClassProperties = await import(pluginPath)
				.then((mod) => mod.default)
				.catch(() => {});

			plugins.push(pluginTransformClassProperties);
		} catch {}

		const jitiPath = require.resolve("jiti");

		const jitiModule = await import(jitiPath);

		if (!jitiModule) {
			throw new Error(wording.error.missinJitiModule());
		}

		const aliases = getTsconfigAliases();

		const createJiti = jitiModule.createJiti;

		const jiti = createJiti(import.meta.url, {
			interopDefault: true,
			fsCache: false,
			alias: aliases,
			transformOptions: {
				ts: true,
				babel: {
					plugins,
				},
			},
		});

		config = await jiti.import(configPath, {
			default: true,
		});
	}

	process.env = originalEnv;

	if (!isFatimaConfig(config)) {
		throw new Error(
			"Config file should export a FatimaConfig object, you can create it with the 'config' function exported from fatima",
		);
	}

	return config;
}
