import {
	fatimaStore,
	type UnsafeEnvironmentVariables,
} from "@fatimajs/tools/lib";
import type { FatimaConfig } from "lib/config";

export const initializeFatimaStore = (
	config: FatimaConfig,
	options: Record<string, string | boolean>,
) => {
	fatimaStore.set("envNames", "");

	fatimaStore.set("storeMarker", "true");

	fatimaStore.set(
		"environment",
		config.environment(process.env as UnsafeEnvironmentVariables),
	);

	fatimaStore.set("configPath", config.file.path);

	fatimaStore.set("heavenPort", String(config.heaven));

	fatimaStore.set("liteMode", String(options.lite));

	fatimaStore.set("debug", String(options.debug));
};
