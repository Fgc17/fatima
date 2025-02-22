import { lifecycle } from "lib/lifecycle";
import { createHeavenClient } from "./client";
import { fatimaStore } from "lib/store";

export function watch(host = "localhost") {
	const isDevMode = Boolean(fatimaStore.get("devMode"));

	if (!isDevMode) return;

	const port = Number(fatimaStore.get("heavenPort"));

	if (!port) return lifecycle.error.missingHeavenPort();

	createHeavenClient(host, port);
}
