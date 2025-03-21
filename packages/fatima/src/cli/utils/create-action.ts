import type { FatimaConfig } from "lib/config";
import { readConfig } from "lib/config/read-config";
import { resolveConfigPath } from "lib/config/resolve-config-path";
import { fatimaStore } from "lib/store";
import type { Promisable, AnyType } from "lib/types";

export interface ActionContext {
	options: Record<string, string>;
	args: string[];
	config: FatimaConfig;
}

export const createAction = <T extends ActionContext>(
	action: (ctx: T) => Promisable<void>,
	contextFn?: (payload: ActionContext) => Promisable<T>,
) => {
	return async (param1: AnyType, param2: AnyType) => {
		const isParam1Array = Array.isArray(param1);

		const args = isParam1Array ? param1 : param2;

		const options = isParam1Array ? param2 : param1;

		fatimaStore.earlyInitialize();

		const configPath = resolveConfigPath(options.config);

		const config = await readConfig(configPath);

		fatimaStore.initialize(config, options);

		const baseContext: ActionContext = { options, args, config };

		const context = contextFn
			? await contextFn(baseContext)
			: (baseContext as T);

		await action(context);
	};
};
