import type {
	FatimaBuiltInLoadFunction,
	UnsafeEnvironmentVariables,
} from "lib/types";
import type { GenericClass, AnyType } from "lib/utils/types";

import { lifecycle } from "lib/lifecycle";

type InfisicalClientMock = GenericClass<
	{
		auth: () => {
			universalAuth: {
				login: (args: {
					clientId: string;
					clientSecret: string;
				}) => Promise<AnyType>;
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

const load =
	(
		infisicalClient: InfisicalClientMock,
		config?: {
			clientId?: string;
			clientSecret?: string;
			projectId?: string;
			environment?: string;
			siteUrl?: string;
		},
	): FatimaBuiltInLoadFunction =>
	async () => {
		const configObject = config ?? {};

		const auth = {
			clientId: process.env.INFISICAL_CLIENT_ID,
			clientSecret: process.env.INFISICAL_CLIENT_SECRET,
			projectId: process.env.INFISICAL_PROJECT_ID,
			siteUrl: process.env.INFISICAL_SITE_URL,
			environment: "dev",
			...configObject,
		};

		if (!auth.clientId) {
			return lifecycle.error.missingConfig("INFISICAL_CLIENT_ID");
		}

		if (!auth.clientSecret) {
			return lifecycle.error.missingConfig("INFISICAL_CLIENT_SECRET");
		}

		if (!auth.projectId) {
			return lifecycle.error.missingConfig("INFISICAL_PROJECT_ID");
		}

		const siteUrl = auth.siteUrl;
		const client = new infisicalClient(siteUrl ? { siteUrl } : undefined);

		await client.auth().universalAuth.login({
			clientId: auth.clientId,
			clientSecret: auth.clientSecret,
		});

		const { secrets } = await client.secrets().listSecrets({
			environment: auth.environment,
			projectId: auth.projectId,
		});

		const env = secrets.reduce((acc, { secretKey, secretValue }) => {
			acc[secretKey] = secretValue;
			return acc;
		}, {} as UnsafeEnvironmentVariables);

		return env;
	};

export const infisical = {
	load,
};
