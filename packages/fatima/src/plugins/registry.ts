import { builtinGenerators } from "../generators";
import { FatimaError } from "../lib/error";
import { builtinModels } from "../models";
import { builtinProviders } from "../providers";
import { loadPlugin } from "./load-plugin";
import type {
	AnyFatimaProviderFactory,
	FatimaGenerator,
	FatimaModel,
	FatimaPlugin,
} from "./types";

export type FatimaRegistry = {
	providers: Record<string, AnyFatimaProviderFactory>;
	models: Record<string, FatimaModel>;
	generators: Record<string, FatimaGenerator>;
};

function mergeRegistryRecord<T>(
	target: Record<string, T>,
	entries: Record<string, T> | undefined,
	type: string,
	pluginName: string,
) {
	if (!entries) {
		return;
	}

	for (const [key, value] of Object.entries(entries)) {
		if (target[key]) {
			throw new FatimaError(
				`Fatima plugin ${pluginName} tried to override existing ${type}: ${key}`,
			);
		}

		target[key] = value;
	}
}

export async function createRegistry(
	pluginSpecifiers: string[] = [],
	baseDir = process.cwd(),
) {
	const registry: FatimaRegistry = {
		providers: { ...builtinProviders },
		models: { ...builtinModels },
		generators: { ...builtinGenerators },
	};

	for (const specifier of pluginSpecifiers) {
		const plugin: FatimaPlugin = await loadPlugin(specifier, baseDir);
		const pluginName = plugin.name ?? specifier;
		mergeRegistryRecord(
			registry.providers,
			plugin.providers,
			"provider",
			pluginName,
		);
		mergeRegistryRecord(registry.models, plugin.models, "model", pluginName);
		mergeRegistryRecord(
			registry.generators,
			plugin.generators,
			"generator",
			pluginName,
		);
	}

	return registry;
}
