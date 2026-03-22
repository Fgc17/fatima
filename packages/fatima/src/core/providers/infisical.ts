import { FatimaError } from "../../lib/errors";
import type {
	FatimaProvider,
	UnsafeEnvironmentVariables,
} from "../../lib/types";
import type { GenericClass } from "../../lib/utils/types";

type InfisicalClientMock = GenericClass<
	{
		auth: () => {
			universalAuth: {
				login: (args: {
					clientId: string;
					clientSecret: string;
				}) => Promise<unknown>;
			};
		};
		secrets: () => {
			listSecrets: (args: {
				environment: string;
				projectId: string;
			}) => Promise<{
				secrets: Array<{
					secretKey: string;
					secretValue: string;
				}>;
			}>;
		};
	},
	| [
			{
				siteUrl: string;
			},
	  ]
	| [undefined]
>;

export const infisical = (
	InfisicalClient: InfisicalClientMock,
	config?: {
		clientId?: string;
		clientSecret?: string;
		projectId?: string;
		environment?: string;
		siteUrl?: string;
	},
): FatimaProvider => {
	return {
		async fetch(processEnv = process.env as UnsafeEnvironmentVariables) {
			const auth = {
				clientId: config?.clientId ?? processEnv.INFISICAL_CLIENT_ID,
				clientSecret:
					config?.clientSecret ?? processEnv.INFISICAL_CLIENT_SECRET,
				projectId: config?.projectId ?? processEnv.INFISICAL_PROJECT_ID,
				siteUrl: config?.siteUrl ?? processEnv.INFISICAL_SITE_URL,
				environment: config?.environment ?? "dev",
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
