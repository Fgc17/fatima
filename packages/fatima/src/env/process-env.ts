import type { UnsafeEnvironmentVariables } from "../config/types";

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
	};
}
