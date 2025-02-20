import type { FatimaConfig } from "src/core/config";
import type { UnsafeEnvironmentVariables } from "src/core/types";

type FatimaStore = {
	fatimaEnvironment: string;
	fatimaConfigPath: string;
	fatimaLogs: string;
	fatimaTransformedConfigPath: string;
	fatimaHeavenPort: string;
	fatimaStoreMarker: string;
	fatimaEnvNames: string;
	fatimaLiteMode: string | undefined;
	fatimaDebug: string | undefined;
	fatimaDevMode: string | undefined;
};

export const fatimaStore = {
	get<K extends keyof FatimaStore>(key: K) {
		return process.env[key] as FatimaStore[K];
	},
	set(key: keyof FatimaStore, value?: string) {
		process.env[key] = value?.toLowerCase().trim();
	},
	exists() {
		return process.env.fatimaStoreMarker === "true";
	},
};

export const initializeStore = (
	config: FatimaConfig,
	options: Record<string, string | boolean>,
) => {
	fatimaStore.set("fatimaEnvNames", "");

	fatimaStore.set("fatimaStoreMarker", "true");

	fatimaStore.set(
		"fatimaEnvironment",
		config.environment(process.env as UnsafeEnvironmentVariables),
	);

	fatimaStore.set("fatimaConfigPath", config.file.path);

	fatimaStore.set("fatimaHeavenPort", String(config.heaven));

	fatimaStore.set("fatimaLiteMode", String(options.lite));

	fatimaStore.set("fatimaDebug", String(options.debug));
};
