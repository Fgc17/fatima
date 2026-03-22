import { providers } from "../core/providers";
import { loadConfig } from "../lib/config/read-config";
import { loadEnvironment, populateEnv } from "../lib/env/load-env";

export const register = (...files: string[]) => {
	const env = providers.local(files).fetch({} as Record<string, string>);

	if (env instanceof Promise) {
		throw new Error("register() only supports synchronous providers.");
	}

	populateEnv(env);
	return env;
};

export async function registerAsync(options?: {
	config?: string;
	environment?: string;
	processEnv?: boolean;
}) {
	const config = await loadConfig(options?.config);

	const result = await loadEnvironment(config, {
		environment: options?.environment,
		useProcessEnv: options?.processEnv,
	});

	populateEnv(result.env);

	return result;
}

try {
	register(".env");
} catch {}
