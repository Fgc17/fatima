import { existsSync, promises as fs } from "node:fs";
import type {
	FatimaProvider,
	FatimaProviderContext,
	FatimaProviderFactory,
} from "../plugins/types";
import { parseEnvLines } from "../env/parse-env";
import { FatimaError } from "../lib/error";
import { runCommand } from "../lib/run-command";

export type VercelLoadConfig = {
	environment?: string;
	vercelToken?: string;
	vercelProjectId?: string;
	vercelOrgId?: string;
};

export const vercel: FatimaProviderFactory<VercelLoadConfig | undefined> = (
	config,
): FatimaProvider => {
	return {
		async fetch({ env }: FatimaProviderContext) {
			const auth = {
				VERCEL_ORG_ID: config?.vercelOrgId ?? env.VERCEL_ORG_ID,
				VERCEL_PROJECT_ID: config?.vercelProjectId ?? env.VERCEL_PROJECT_ID,
				VERCEL_TOKEN: config?.vercelToken ?? env.VERCEL_TOKEN,
				VERCEL_ENVIRONMENT:
					config?.environment ?? env.VERCEL_ENVIRONMENT ?? "development",
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
					...env,
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
