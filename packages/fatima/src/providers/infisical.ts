import type {
	FatimaProvider,
	FatimaProviderConfig,
	UnsafeEnvironmentVariables,
} from "../config/types";
import { FatimaError } from "../lib/error";
import { loadOptionalDependency } from "../lib/load-optional-dependency";

type InfisicalClientInstance = {
	auth: () => {
		universalAuth: {
			login: (args: {
				clientId: string;
				clientSecret: string;
			}) => Promise<unknown>;
		};
	};
	secrets: () => {
		listSecrets: (args: { environment: string; projectId: string }) => Promise<{
			secrets: Array<{
				secretKey: string;
				secretValue: string;
			}>;
		}>;
	};
};

type InfisicalClientClass = new (
	config?: { siteUrl: string } | undefined,
) => InfisicalClientInstance;

export type InfisicalConfig = FatimaProviderConfig & {
	clientId?: string;
	clientSecret?: string;
	projectId?: string;
	siteUrl?: string;
};

export const infisical = (config?: InfisicalConfig): FatimaProvider => {
	return {
		async fetch(processEnv = process.env as UnsafeEnvironmentVariables) {
			const mod = loadOptionalDependency<{
				InfisicalSDK?: InfisicalClientClass;
			}>(
				"@infisical/sdk",
				'Missing dependency: install "@infisical/sdk" in your project to use `providers.infisical()`.',
			);
			const InfisicalClient = mod.InfisicalSDK;

			if (!InfisicalClient) {
				throw new FatimaError(
					'Failed to load `InfisicalSDK` from "@infisical/sdk".',
				);
			}

			const auth = {
				clientId: config?.clientId ?? processEnv.INFISICAL_CLIENT_ID,
				clientSecret:
					config?.clientSecret ?? processEnv.INFISICAL_CLIENT_SECRET,
				projectId: config?.projectId ?? processEnv.INFISICAL_PROJECT_ID,
				siteUrl: config?.siteUrl ?? processEnv.INFISICAL_SITE_URL,
				environment:
					config?.environment ?? processEnv.INFISICAL_ENVIRONMENT ?? "dev",
			};

			if (!auth.clientId) {
				throw new FatimaError("Missing configuration: INFISICAL_CLIENT_ID");
			}

			if (!auth.clientSecret) {
				throw new FatimaError("Missing configuration: INFISICAL_CLIENT_SECRET");
			}

			if (!auth.projectId) {
				throw new FatimaError("Missing configuration: INFISICAL_PROJECT_ID");
			}

			const client = new InfisicalClient(
				auth.siteUrl ? { siteUrl: auth.siteUrl } : undefined,
			);

			await client.auth().universalAuth.login({
				clientId: auth.clientId,
				clientSecret: auth.clientSecret,
			});

			const { secrets } = await client.secrets().listSecrets({
				environment: auth.environment,
				projectId: auth.projectId,
			});

			return secrets.reduce((env, secret) => {
				env[secret.secretKey] = secret.secretValue;
				return env;
			}, {} as UnsafeEnvironmentVariables);
		},
	};
};
