import type {
	FatimaBuiltInLoadFunction,
	UnsafeEnvironmentVariables,
} from "lib/types";
import { wording } from "lib/wording";

export interface HerokuLoadOptions {
	app_id_or_name: string;
	bearer_token?: string;
}

const load =
	(config: HerokuLoadOptions): FatimaBuiltInLoadFunction =>
	async () => {
		const auth = {
			bearer_token: config.bearer_token ?? process.env.HEROKU_API_TOKEN,
		};

		if (!auth.bearer_token) {
			throw new Error(wording.error.missingConfig("HEROKU_API_TOKEN"));
		}

		const headers = new Headers();
		headers.append("Authorization", `Bearer ${auth.bearer_token}`);
		headers.append("Accept", "application/vnd.heroku+json; version=3");

		const env = await fetch(
			`https://api.heroku.com/apps/${config.app_id_or_name}/config-vars`,
			{
				headers,
			},
		)
			.then(async (res) => {
				if (!res.ok) {
					const errorText = await res.text();
					throw new Error("Failed to fetch Heroku config vars", {
						cause: errorText,
					});
				}

				return await res.json();
			})
			.then((env) => env as UnsafeEnvironmentVariables);

		return env;
	};

export const heroku = {
	load,
};
