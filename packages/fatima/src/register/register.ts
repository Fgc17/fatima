import type { UnsafeEnvironmentVariables } from "lib/types";
import { populateEnv } from "lib/env/patch-env";
import { local } from "core/adapters/local";
import { resolve } from "node:path";

export const register = (...files: string[]) => {
	const resolvedFiles = files.map((file) => resolve(file));

	const env = local.load(...resolvedFiles)() as UnsafeEnvironmentVariables;

	populateEnv(env);
};

register(".env");
