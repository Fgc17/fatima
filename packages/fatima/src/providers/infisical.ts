import { FatimaError } from "../lib/error";
import { loadOptionalDependency } from "../lib/load-optional-dependency";
import type {
	FatimaProvider,
	FatimaProviderContext,
	FatimaProviderFactory,
} from "../plugins/types";

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

export type InfisicalConfig = {
	environment?: string;
	clientId?: string;
	clientSecret?: string;
	projectId?: string;
	siteUrl?: string;
};

export const infisical: FatimaProviderFactory<InfisicalConfig | undefined> = (
	config,
): FatimaProvider => {
	return {
		async fetch({ env }: FatimaProviderContext) {
			const mod = loadOptionalDependency<{
				InfisicalSDK?: InfisicalClientClass;
			}>(
				"@infisical/sdk",
				'Missing dependency: install "@infisical/sdk" in your project to use the infisical provider.',
			);
			const InfisicalClient = mod.InfisicalSDK;

			if (!InfisicalClient) {
				throw new FatimaError(
					'Failed to load `InfisicalSDK` from "@infisical/sdk".',
				);
			}

			const auth = {
				clientId: config?.clientId ?? env.INFISICAL_CLIENT_ID,
				clientSecret: config?.clientSecret ?? env.INFISICAL_CLIENT_SECRET,
				projectId: config?.projectId ?? env.INFISICAL_PROJECT_ID,
				siteUrl: config?.siteUrl ?? env.INFISICAL_SITE_URL,
				environment: config?.environment ?? env.INFISICAL_ENVIRONMENT ?? "dev",
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

			return secrets.reduce<Record<string, string>>((acc, secret) => {
				acc[secret.secretKey] = secret.secretValue;
				return acc;
			}, {});
		},
	};
};
