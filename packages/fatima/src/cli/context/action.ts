import type { FatimaConfig } from "core/config";
import { readConfig } from "lib/config/read-config";
import { resolveConfigPath } from "lib/config/resolve-config-path";
import { logger } from "lib/logger";
import { fatimaStore } from "lib/store";
import type { AnyType, Promisable } from "lib/utils/types";

export interface ActionContext {
	options: Record<string, string>;
	args: string[];
	config: FatimaConfig;
}

export const action = <T extends ActionContext>(
	action: (ctx: T) => Promisable<void>,
	contextFn?: (payload: ActionContext) => Promisable<T>,
) => {
	return async (param1: AnyType, param2: AnyType, param3: AnyType) => {
		try {
			const hasPositionalArgs = Array.isArray(param1);

			const program = hasPositionalArgs ? param3 : param2;

			const args = hasPositionalArgs ? param1 : param2;

			const options = program.optsWithGlobals();

			fatimaStore.earlyInitialize();

			const configPath = resolveConfigPath(options.config);

			const config = await readConfig(configPath);

			fatimaStore.initialize(config, options);

			const baseContext: ActionContext = { options, args, config };

			const context = contextFn
				? await contextFn(baseContext)
				: (baseContext as T);

			await action(context);
		} catch (error) {
			logger.error(error.message);

			if (fatimaStore.get("debug")) {
				console.error(error.cause);
			}

			process.exit(1);
		}
	};
};
