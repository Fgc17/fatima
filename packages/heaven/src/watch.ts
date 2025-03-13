import { logger } from "lib/logger";
import { createHeavenClient } from "./client";
import { fatimaStore } from "lib/store";

export function watch(host = "localhost") {
	const isDevMode = Boolean(process.env.fatima_devMode);

	if (!isDevMode) return;

	const port = fatimaStore.get("heavenPort");

	if (!port) {
		logger.error("You need to set 'config.heaven' to use the watch feature.");

		console.log("");

		process.exit(1);
	}

	createHeavenClient(host, port);
}
