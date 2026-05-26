import { FatimaError } from "../lib/error";
import {
	getSecretManagerSettings,
	listAccessKeyEnvironments,
	listSecretsWithAccessKey,
	unlockSecretManagerWithPassword,
} from "./api";
import type {
	LocalVaultStoreOptions,
	SecretRecord,
	UnlockedVault,
} from "./types";

export type FatimaVaultAuthKind = "password" | "key";

export type FatimaLocalVaultOptions = LocalVaultStoreOptions;

type FatimaLocalVaultSession =
	| {
			kind: "password";
			unlocked: UnlockedVault;
	  }
	| {
			kind: "key";
			rawKey: string;
			environments: string[];
	  };

function toEnvironmentMap(secrets: SecretRecord[]): Record<string, string> {
	return Object.fromEntries(
		secrets.map((secret) => [secret.key, secret.value]),
	) as Record<string, string>;
}

export class FatimaLocalVault {
	readonly options: FatimaLocalVaultOptions;
	#session: FatimaLocalVaultSession | null = null;

	constructor(options: FatimaLocalVaultOptions = {}) {
		this.options = options;
	}

	authenticate(kind: FatimaVaultAuthKind, value: string): this {
		if (kind === "password") {
			this.#session = {
				kind,
				unlocked: unlockSecretManagerWithPassword(value, this.options),
			};
			return this;
		}

		this.#session = {
			kind,
			rawKey: value,
			environments: listAccessKeyEnvironments(value, { config: this.options }),
		};
		return this;
	}

	isAuthenticated(): boolean {
		return this.#session != null;
	}

	listEnvironments(): string[] {
		const session = this.#requireSession();

		if (session.kind === "password") {
			return [...session.unlocked.config.environments];
		}

		return [...session.environments];
	}

	getSecrets(environment?: string): Record<string, string> {
		const session = this.#requireSession();

		if (session.kind === "password") {
			const selectedEnvironment =
				environment ?? session.unlocked.config.defaultEnvironment;

			if (!session.unlocked.config.environments.includes(selectedEnvironment)) {
				throw new FatimaError(
					`Unknown Fatima environment: ${selectedEnvironment}`,
				);
			}

			return toEnvironmentMap(
				session.unlocked.vault[selectedEnvironment] ?? [],
			);
		}

		return listSecretsWithAccessKey(session.rawKey, {
			config: this.options,
			environment,
		}).secrets;
	}

	getDefaultEnvironment(): string {
		const session = this.#session;

		if (session?.kind === "password") {
			return session.unlocked.config.defaultEnvironment;
		}

		return getSecretManagerSettings(this.options).defaultEnvironment;
	}

	#requireSession(): FatimaLocalVaultSession {
		if (!this.#session) {
			throw new FatimaError("Fatima local vault is not authenticated.");
		}

		return this.#session;
	}
}
