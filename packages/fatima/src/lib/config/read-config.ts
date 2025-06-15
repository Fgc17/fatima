import type { FatimaConfig } from ".";
import { createRequire } from "node:module";
import { isTypescriptFile } from "src/lib/utils/is-typescript";
import { isFatimaConfig } from "./utils";
import { lifecycle } from "lib/lifecycle";
import { logger } from "lib/logger";
import { getTsconfigAliases } from "lib/tsconfig/tsconfig";

const require = createRequire(import.meta.url);

export async function readConfig(configPath: string): Promise<FatimaConfig> {
	try {
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
				return lifecycle.error.missinJitiModule();
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
			logger.error(
				"Config file must be created with the fatima config function.",
			);
			process.exit(1);
		}

		return config;
	} catch (error) {
		logger.error(error);
		logger.error("Failed to read config file, check if it exists.");
		process.exit(1);
	}
}
