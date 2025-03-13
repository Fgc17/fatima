import type {
	AnyType,
	FatimaBuiltInLoadFunction,
	GenericClass,
	UnsafeEnvironmentVariables,
} from "lib/types";

import { lifecycle } from "lib/lifecycle";

type InfisicalClientMock = GenericClass<{
	auth: () => {
		universalAuth: {
			login: (args: {
				clientId: string;
				clientSecret: string;
			}) => Promise<AnyType>;
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
}>;

const load =
	(
		infisicalClient: InfisicalClientMock,
		config?: {
			clientId: string;
			clientSecret: string;
			projectId: string;
			environment?: string;
		},
	): FatimaBuiltInLoadFunction =>
	async () => {
		const client = new infisicalClient();

		const auth = {
			...config,
			clientId: process.env.INFISICAL_CLIENT_ID,
			clientSecret: process.env.INFISICAL_CLIENT_SECRET,
			projectId: process.env.INFISICAL_PROJECT_ID,
			environment: "dev",
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
