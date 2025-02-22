import type { FatimaBuiltInLoadFunction } from "lib/types";
import {
	type UnsafeEnvironmentVariables,
	createInjectableEnv,
	logger,
} from "@fatimajs/tools/lib";
import { spawn } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import { lifecycle } from "lib/lifecycle";
import { parseEnvLines } from "lib/env/parse-env";

export type VercelParseFunction = (
	envFileContent: string,
) => UnsafeEnvironmentVariables;

export interface VercelLoadConfig {
	/**
	 * The Vercel token from your Vercel account settings.
	 * @link https://vercel.com/account/settings
	 */
	vercelToken?: string;
	/**
	 * The Vercel project ID.
	 *
	 * Use the following URL with your own values to get the project ID:
	 * @link https://vercel.com/your-team-name/your-project-name/settings#project-id
	 */
	vercelProjectId?: string;
	/**
	 * The Vercel organization ID.
	 *
	 * Use the following URL with your own values to get the org ID:
	 * @link https://vercel.com/teams/your-team-name/settings#team-id
	 */
	vercelOrgId?: string;
	/**
	 * The environment to pull the variables from.
	 *
	 * @default "development"
	 */
	vercelEnvironment?: string;
}

const load =
	(config?: VercelLoadConfig): FatimaBuiltInLoadFunction =>
	async () => {
		try {
			const isProjectLinked = existsSync("./.vercel");

			const auth = {
				VERCEL_ORG_ID:
					config?.vercelOrgId ?? (process.env.VERCEL_ORG_ID as string),
				VERCEL_PROJECT_ID:
					config?.vercelProjectId ?? (process.env.VERCEL_PROJECT_ID as string),
				VERCEL_TOKEN:
					config?.vercelToken ?? (process.env.VERCEL_TOKEN as string),
				VERCEL_PROJECT_ENV: config?.vercelEnvironment ?? "development",
			} as const satisfies Record<string, string>;

			const injectableEnv = createInjectableEnv(auth);

			const args = [
				"env",
				"pull",
				".tmp.vercel.env",
				`--environment=${auth.VERCEL_PROJECT_ENV}`,
			];

			if (!isProjectLinked) {
				if (!auth.VERCEL_ORG_ID) {
					return lifecycle.error.missingConfig("VERCEL_ORG_ID");
				}

				if (!auth.VERCEL_PROJECT_ID) {
					return lifecycle.error.missingConfig("VERCEL_PROJECT_ID");
				}

				if (!auth.VERCEL_TOKEN) {
					return lifecycle.error.missingConfig("VERCEL_TOKEN");
				}

				args.push(`--token=${auth.VERCEL_TOKEN}`);
			}

			await new Promise<void>((resolve, reject) => {
				const child = spawn("vercel", args, {
					env: injectableEnv,
				});

				child.on("error", (e) => {
					reject(e);
				});

				child.on("close", (code) => {
					if (code === 0) {
						resolve();
					} else {
						reject(new Error(`Process exited with code ${code}`));
					}
				});
			});

			const envFileContent = await fs.readFile(".tmp.vercel.env", "utf-8");

			const envVariables = parseEnvLines(envFileContent);

			await fs.unlink(".tmp.vercel.env");

			return envVariables;
		} catch (error) {
			logger.error(
				"Fatima could not load secrets from Vercel, here are some possible reasons:\n",
				"1. You didn't install the Vercel CLI: 'npm i -g vercel'",
				"",
				"2. You didn't authenticate correctly:",
				"  - Authenticate by CLI: run 'vercel login' and then 'vercel link'",
				"  - * you can delete the .vercel folder and try again",
				"",
				"  - Authenticate by TOKEN: VERCEL_TOKEN, VERCEL_PROJECT_ID, and VERCEL_ORG_ID",
				"  - * you can auth by token via .env or passing down the options to the loader",
				"",
				`3. You don't have the '${config?.vercelEnvironment ?? "development"}' environment in your project.`,
			);
			process.exit(1);
		}
	};

export const vercel = {
	load,
};
