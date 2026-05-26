import { FatimaError } from "../lib/error";
import type { FatimaProvider, FatimaProviderFactory } from "../plugins/types";
import {
	FatimaLocalVault,
	type FatimaVaultAuthKind,
} from "../vault/local-vault";

export type FatimaLocalVaultProviderConfig = {
	auth: FatimaVaultAuthKind;
	credential: string;
	environment?: string;
	config?: string;
	cwd?: string;
	storePath?: string;
};

export const fatimaLocalVault: FatimaProviderFactory<
	FatimaLocalVaultProviderConfig
> = ({ auth, credential, ...config }): FatimaProvider => {
	return {
		fetch(context) {
			if (!credential) {
				throw new FatimaError(
					`fatima-local-vault provider requires ${auth === "key" ? "key" : "password"}.`,
				);
			}

			const vault = new FatimaLocalVault({
				config: config.config,
				cwd: config.cwd ?? context.cwd,
				storePath: config.storePath,
			});

			vault.authenticate(auth, credential);

			return vault.getSecrets(config.environment ?? context.environment);
		},
	};
};
