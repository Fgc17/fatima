import type {
	FatimaProvider,
	FatimaProviderConfig,
	UnsafeEnvironmentVariables,
} from "../config/types";
import { FatimaError } from "../lib/error";

export type HerokuLoadOptions = FatimaProviderConfig & {
	app_id_or_name?: string;
	bearer_token?: string;
};

export const heroku = (config: HerokuLoadOptions = {}): FatimaProvider => {
	return {
		async fetch(processEnv = process.env as UnsafeEnvironmentVariables) {
			const appIdOrName =
				config.app_id_or_name ?? processEnv.HEROKU_APP_ID_OR_NAME;
			const bearerToken = config.bearer_token ?? processEnv.HEROKU_API_TOKEN;

			if (!appIdOrName) {
				throw new FatimaError("Missing configuration: HEROKU_APP_ID_OR_NAME");
			}

			if (!bearerToken) {
				throw new FatimaError("Missing configuration: HEROKU_API_TOKEN");
			}

			const headers = new Headers();
			headers.append("Authorization", `Bearer ${bearerToken}`);
			headers.append("Accept", "application/vnd.heroku+json; version=3");

			const response = await fetch(
				`https://api.heroku.com/apps/${appIdOrName}/config-vars`,
				{ headers },
			);

			if (!response.ok) {
				throw new FatimaError("Failed to fetch Heroku config vars.", {
					cause: await response.text(),
				});
			}

			return (await response.json()) as UnsafeEnvironmentVariables;
		},
	};
};
