import { loadEnv } from "lib/env/load-env";
import type { ActionContext } from "./action";

export const envActionContext = async ({
	args,
	options,
	config,
}: ActionContext) => {
	const { env: loadedEnv, envCount } = await loadEnv(config);

	const env = loadedEnv;

	return { config, env, envCount, options, args };
};

export type EnvActionContext = Awaited<ReturnType<typeof envActionContext>>;
