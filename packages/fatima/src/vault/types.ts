export type SecretManagerFormat = "dotenv" | "github-env" | "json" | "shell";

export type EncryptedBlob = {
	iv: string;
	tag: string;
	ciphertext: string;
};

export type ProjectSecretManagerSettings = {
	defaultEnvironment: string;
	environments: string[];
	storePath: string;
};

export type LocalVaultStoreOptions = {
	config?: string;
	cwd?: string;
	storePath?: string;
};

export type LocalVaultStoreInput = string | LocalVaultStoreOptions;

export type StoredProjectConfig = {
	version: 2;
	mode: "local";
	createdAt: string;
	updatedAt: string;
	defaultEnvironment: string;
	environments: string[];
	store: string;
};

export type PrimaryKeyRecord = {
	salt: string;
};

export type AccessKeyRecord = {
	id: string;
	name: string;
	salt: string;
	wrappedEnvironmentKeys: Record<string, EncryptedBlob>;
};

export type StoredKeys = {
	primary: PrimaryKeyRecord;
	environmentKeys: Record<string, EncryptedBlob>;
	accessKeys: AccessKeyRecord[];
};

export type StoredVault = {
	version: 2;
	environments: Record<string, EncryptedBlob>;
};

export type SecretRecord = {
	id: string;
	key: string;
	value: string;
};

export type StoredState = {
	selectedEnvironment?: string;
	view?: "environment" | "matrix";
	showValues?: boolean;
	lastImportPath?: string;
};

export type UnlockedVault = {
	project: ProjectSecretManagerSettings;
	config: StoredProjectConfig;
	keys: StoredKeys;
	vault: Record<string, SecretRecord[]>;
	passwordKey: Buffer;
	environmentKeys: Record<string, Buffer>;
};

export type AuthenticatedAccess = {
	kind: "access";
	record: AccessKeyRecord;
	environmentKeys: Record<string, Buffer>;
};
