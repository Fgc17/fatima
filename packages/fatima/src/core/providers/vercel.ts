import { existsSync, promises as fs } from "node:fs";
import { parseEnvLines } from "../../lib/env/parse-env";
import { FatimaError } from "../../lib/errors";
import { runCommand } from "../../lib/exec";
import type {
	FatimaProvider,
	UnsafeEnvironmentVariables,
} from "../../lib/types";

export interface VercelLoadConfig {
	vercelToken?: string;
	vercelProjectId?: string;
	vercelOrgId?: string;
	vercelEnvironment?: string;
}

export const vercel = (config?: VercelLoadConfig): FatimaProvider => {
	return {
		async fetch(processEnv = process.env as UnsafeEnvironmentVariables) {
			const auth = {
				VERCEL_ORG_ID: config?.vercelOrgId ?? processEnv.VERCEL_ORG_ID,
				VERCEL_PROJECT_ID:
					config?.vercelProjectId ?? processEnv.VERCEL_PROJECT_ID,
				VERCEL_TOKEN: config?.vercelToken ?? processEnv.VERCEL_TOKEN,
				VERCEL_ENVIRONMENT: config?.vercelEnvironment ?? "development",
			};

			const args = [
				"env",
				"pull",
				".tmp.vercel.env",
				`--environment=${auth.VERCEL_ENVIRONMENT}`,
			];

			if (!existsSync(".vercel")) {
				if (!auth.VERCEL_ORG_ID) {
					throw new FatimaError("Missing configuration: VERCEL_ORG_ID");
				}

				if (!auth.VERCEL_PROJECT_ID) {
					throw new FatimaError("Missing configuration: VERCEL_PROJECT_ID");
				}

				if (!auth.VERCEL_TOKEN) {
					throw new FatimaError("Missing configuration: VERCEL_TOKEN");
				}

				args.push(`--token=${auth.VERCEL_TOKEN}`);
			}

			const exitCode = await runCommand(["vercel", ...args], {
				env: {
					...processEnv,
					VERCEL_ORG_ID: auth.VERCEL_ORG_ID,
					VERCEL_PROJECT_ID: auth.VERCEL_PROJECT_ID,
					VERCEL_TOKEN: auth.VERCEL_TOKEN,
				},
				stdio: "ignore",
			});

			if (exitCode !== 0) {
				throw new FatimaError(
					"Failed to pull environment variables from Vercel.",
				);
			}

			const content = await fs.readFile(".tmp.vercel.env", "utf8");
			await fs.unlink(".tmp.vercel.env");

			return parseEnvLines(content);
		},
	};
};
