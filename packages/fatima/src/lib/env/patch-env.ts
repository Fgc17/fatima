import type { UnsafeEnvironmentVariables } from "src/core/types";
import { fatimaStore } from "../store/store";
import { debug } from "../logger/debugger";

export function createInjectableEnv(env?: UnsafeEnvironmentVariables) {
	return {
		...process.env,
		...env,
	} as UnsafeEnvironmentVariables;
}

export function populateEnv(env: UnsafeEnvironmentVariables = {}) {
	Object.assign(process.env, env);
}

export function initializeEnv(env: UnsafeEnvironmentVariables = {}) {
	process.env = {
		...process.env,
		...env,
		FORCE_COLOR: "1",
	};
}
