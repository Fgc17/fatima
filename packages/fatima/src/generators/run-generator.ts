import { writeFileSync } from "node:fs";
import path from "node:path";
import type { NormalizedFatimaConfig, UnsafeEnvironmentVariables } from "../config/types";
import type { FatimaDebugLogger } from "../lib/debug";
import { FatimaError } from "../lib/error";
import type { FatimaRegistry } from "../plugins/registry";

export async function runGenerator(
	config: NormalizedFatimaConfig,
	registry: FatimaRegistry,
	environment: string,
	env: UnsafeEnvironmentVariables,
	loadedEnv: UnsafeEnvironmentVariables,
	debug?: FatimaDebugLogger,
) {
	const generator = registry.generators[config.generator];

	if (!generator) {
		throw new FatimaError(`Unknown Fatima generator: ${config.generator}`);
	}

	const files = await generator.generate({
		cwd: process.cwd(),
		configPath: config.configFile.path,
		generator: config.generator,
		file: config.file,
		formatter: config.formatter,
		environment,
		env,
		loadedEnv,
		publicPrefix: config.publicPrefix,
		model: config.model,
		registry: {
			models: registry.models,
		},
	});

	for (const item of files) {
		const outputPath = path.resolve(config.configFile.folderPath, item.path);
		debug?.debug("generate:write", "Writing generated file", { outputPath });
		writeFileSync(outputPath, item.content);
	}

	return path.resolve(config.configFile.folderPath, files[0]?.path ?? config.file);
}
