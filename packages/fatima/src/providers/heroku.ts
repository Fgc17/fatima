import { FatimaError } from "../lib/error";
import type {
	FatimaProvider,
	FatimaProviderContext,
	FatimaProviderFactory,
} from "../plugins/types";

export type HerokuLoadOptions = {
	environment?: string;
	app_id_or_name?: string;
	bearer_token?: string;
};

export const heroku: FatimaProviderFactory<HerokuLoadOptions | undefined> = (
	config = {},
): FatimaProvider => {
	return {
		async fetch({ env }: FatimaProviderContext) {
			const appIdOrName = config.app_id_or_name ?? env.HEROKU_APP_ID_OR_NAME;
			const bearerToken = config.bearer_token ?? env.HEROKU_API_TOKEN;

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

			return (await response.json()) as Record<string, string>;
		},
	};
};
