import type { FatimaConfig } from "lib/config";
import { readConfig } from "lib/config/read-config";
import { resolveConfigPath } from "lib/config/resolve-config-path";
import { loadEnv } from "lib/env/load-env";
import { fatimaStore } from "lib/store";
import type {
	UnsafeEnvironmentVariables,
	Promisable,
	AnyType,
} from "lib/types";

export interface ActionContext {
	config: FatimaConfig;
	env: UnsafeEnvironmentVariables;
	envCount: number;
	args: string[];
	options: Record<string, string>;
}

export const createAction = (
	action: (ctx: ActionContext) => Promisable<void>,
	load = true,
) => {
	return async (param1: AnyType, param2: AnyType) => {
		const isParam1Array = Array.isArray(param1);

		const args = isParam1Array ? param1 : param2;

		const options = isParam1Array ? param2 : param1;

		const configPath = resolveConfigPath(options.config);

		const config = await readConfig(configPath);

		fatimaStore.initialize(config, options);

		if (load) {
			const { env, envCount } = await loadEnv(config);

			await action({ config, env, envCount, args, options });
		} else {
			await action({ config, env: {}, envCount: 0, args, options });
		}

		if (!process.env.npm_package_version) {
			console.log("");
		}
	};
};
