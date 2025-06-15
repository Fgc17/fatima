import type { FatimaConfig } from "core/config";
import { reloadEnv } from "../env/reload-env";
import { createFileWatcher } from "./file-watcher";
import { createHeavenServer } from "./heaven-server";

export function createHeaven(config: FatimaConfig) {
	let closeHeaven = () => {};

	let reload = async () => {
		await reloadEnv(config);
	};

	if (config.heaven) {
		const { send, server: heavenServer } = createHeavenServer(
			config.heaven,
			() => reloadEnv(config),
		);

		reload = async () => {
			await send();
		};

		closeHeaven = heavenServer.close;
	}

	createFileWatcher(reload);

	return { closeHeaven };
}
