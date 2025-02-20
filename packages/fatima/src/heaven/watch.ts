import { lifecycle } from "src/core/lifecycle";
import { createHeavenClient } from "src/lib/heaven/heaven-client";
import { fatimaStore } from "src/lib/store/store";

export function watch(host = "localhost") {
	const isDevMode = fatimaStore.get("fatimaDevMode");

	if (!isDevMode) return;

	const port = Number(fatimaStore.get("fatimaHeavenPort"));

	if (!port) return lifecycle.error.missingWatchPort();

	createHeavenClient(host, port);
}
