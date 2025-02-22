import type { FatimaConfig } from "../config";
import { createFileWatcher } from "lib/heaven/file-watcher";
import { createHeavenServer } from "lib/heaven/heaven-server";
import { reloadEnv } from "./reload-env";

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
