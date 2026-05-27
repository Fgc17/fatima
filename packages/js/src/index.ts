import { spawn } from "node:child_process";

export type ProviderConfig = {
	provider: string;
	[key: string]: unknown;
};

export type ModelConfig = Record<string, unknown>;

export type FatimaConfig = {
	generator?: string;
	file?: string;
	environment?: string;
	providers?: Record<string, ProviderConfig[]>;
	model?: ModelConfig;
	publicPrefix?: string;
};

export type FatimaOptions = {
	bin?: string;
	cwd?: string;
	config?: FatimaConfig | string;
};

export type LoadedEnvironment = {
	env: Record<string, string>;
	environment: string;
	loadedEnv: Record<string, string>;
	providersUsed: number;
};

export type GenerateResult = {
	outputPath: string;
	environment: string;
	loadedEnv: Record<string, string>;
};

export type VaultOptions = {
	cwd?: string;
	storePath?: string;
};

export type ProjectSecretManagerSettings = {
	defaultEnvironment: string;
	environments: string[];
	storePath: string;
};

export type EncryptedBlob = {
	iv: string;
	tag: string;
	ciphertext: string;
};

export type AccessKeyRecord = {
	id: string;
	name: string;
	salt: string;
	wrappedEnvironmentKeys: Record<string, EncryptedBlob>;
};

export type SecretRecord = {
	id: string;
	key: string;
	value: string;
};

export type FatimaVaultSnapshot = {
	project: ProjectSecretManagerSettings;
	config: Record<string, unknown>;
	keys: Record<string, unknown>;
	vault: Record<string, SecretRecord[]>;
};

type ApiRequest = {
	method: string;
	params?: unknown;
};

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

type ApiClientOptions = Pick<FatimaOptions, "bin" | "cwd">;

export class Fatima {
	#bin: string;
	#cwd?: string;
	#config: FatimaConfig | string;

	constructor(options: FatimaOptions = {}) {
		this.#bin = options.bin ?? "fatima";
		this.#cwd = options.cwd;
		this.#config = options.config ?? { providers: {}, model: {} };
	}

	addProvider(environment: string, provider: ProviderConfig): this {
		if (typeof this.#config === "string") {
			this.#config = { providers: {}, model: {} };
		}
		this.#config.providers ??= {};
		this.#config.providers[environment] ??= [];
		this.#config.providers[environment].push(provider);
		return this;
	}

	setModel(model: ModelConfig): this {
		if (typeof this.#config === "string") this.#config = {};
		this.#config.model = model;
		return this;
	}

	setPublicPrefix(publicPrefix: string): this {
		if (typeof this.#config === "string") this.#config = {};
		this.#config.publicPrefix = publicPrefix;
		return this;
	}

	async loadEnvironment(environment = "development"): Promise<LoadedEnvironment> {
		return this.#call<LoadedEnvironment>("loadEnvironment", { environment });
	}

	async secrets(environment = "development"): Promise<Record<string, string>> {
		return this.#call<Record<string, string>>("secrets", { environment });
	}

	async validate(environment = "development"): Promise<{ valid: true }> {
		return this.#call<{ valid: true }>("validate", { environment });
	}

	async generate(options: { environment?: string; strict?: boolean } = {}): Promise<GenerateResult> {
		return this.#call<GenerateResult>("generate", options);
	}

	async #call<T>(method: string, params: Record<string, unknown>): Promise<T> {
		return callFatimaApi<T>(
			{ method, params: { ...params, config: this.#config } },
			{ bin: this.#bin, cwd: this.#cwd },
		);
	}
}

export class FatimaVault {
	#bin: string;
	#cwd?: string;
	#options: VaultOptions;
	#auth: { password?: string; key?: string } = {};

	constructor(options: FatimaOptions & { storePath?: string } = {}) {
		this.#bin = options.bin ?? "fatima";
		this.#cwd = options.cwd;
		this.#options = { cwd: options.cwd, storePath: options.storePath };
	}

	static async hasStore(options: FatimaOptions & { storePath?: string } = {}): Promise<boolean> {
		return vaultCall<boolean>("vault.hasStore", { options: toVaultOptions(options) }, options);
	}

	static async getSettings(options: FatimaOptions & { storePath?: string } = {}): Promise<ProjectSecretManagerSettings> {
		return vaultCall<ProjectSecretManagerSettings>("vault.getSettings", { options: toVaultOptions(options) }, options);
	}

	static async initialize(password: string, options: FatimaOptions & { storePath?: string } = {}): Promise<FatimaVault> {
		await vaultCall("vault.initialize", { password, options: toVaultOptions(options) }, options);
		return new FatimaVault(options).unlockWithPassword(password);
	}

	unlockWithPassword(password: string): this {
		this.#auth = { password };
		return this;
	}

	authenticateWithKey(key: string): this {
		this.#auth = { key };
		return this;
	}

	async secrets(environment?: string): Promise<Record<string, string>> {
		return this.#call<Record<string, string>>("vault.secrets", { environment });
	}

	async listEnvironments(): Promise<string[]> {
		return this.#call<string[]>("vault.listEnvironments", {});
	}

	async generateAccessKey(name: string, environments: string[]): Promise<{ key: string; record: AccessKeyRecord }> {
		return this.#call("vault.generateAccessKey", { name, environments });
	}

	async setSecret(environment: string, key: string, value: string, options: { id?: string } = {}): Promise<void> {
		await this.#call("vault.setSecret", { environment, secretKey: key, value, id: options.id });
	}

	async deleteSecret(environment: string, id: string): Promise<void> {
		await this.#call("vault.deleteSecret", { environment, id });
	}

	async createEnvironment(environment: string): Promise<void> {
		await this.#call("vault.createEnvironment", { environment });
	}

	async renameEnvironment(environment: string, name: string): Promise<void> {
		await this.#call("vault.renameEnvironment", { environment, name });
	}

	async deleteEnvironment(environment: string): Promise<{ defaultEnvironment: string }> {
		return this.#call("vault.deleteEnvironment", { environment });
	}

	async importEnv(environment: string, filePath: string): Promise<{ count: number }> {
		return this.#call("vault.importEnv", { environment, filePath });
	}

	async changePassword(password: string): Promise<void> {
		await this.#call("vault.changePassword", { value: password });
		this.#auth = { password };
	}

	async snapshot(): Promise<FatimaVaultSnapshot> {
		return this.#call("vault.snapshot", {});
	}

	async #call<T>(method: string, params: Record<string, unknown>): Promise<T> {
		return vaultCall<T>(
			method,
			{ ...params, ...this.#auth, options: this.#options },
			{ bin: this.#bin, cwd: this.#cwd },
		);
	}
}

function toVaultOptions(options: FatimaOptions & { storePath?: string }): VaultOptions {
	return { cwd: options.cwd, storePath: options.storePath };
}

function vaultCall<T>(method: string, params: unknown, options: ApiClientOptions): Promise<T> {
	return callFatimaApi<T>({ method, params }, options);
}

async function callFatimaApi<T>(request: ApiRequest, options: ApiClientOptions): Promise<T> {
	const response = await runFatimaApi<T>(options.bin ?? "fatima", request, { cwd: options.cwd });
	if (!response.ok) throw new Error(response.error);
	return response.data;
}

function runFatimaApi<T>(
	bin: string,
	request: ApiRequest,
	options: { cwd?: string },
): Promise<ApiResponse<T>> {
	return new Promise((resolve, reject) => {
		const child = spawn(bin, ["api", JSON.stringify(request)], {
			cwd: options.cwd,
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk: string) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk: string) => {
			stderr += chunk;
		});
		child.on("error", reject);
		child.on("close", () => {
			try {
				resolve(JSON.parse(stdout) as ApiResponse<T>);
			} catch (error) {
				reject(
					new Error(
						`Failed to parse fatima api response: ${error instanceof Error ? error.message : String(error)}${stderr ? `\n${stderr}` : ""}`,
					),
				);
			}
		});
	});
}
