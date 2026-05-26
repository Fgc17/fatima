import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	randomUUID,
	scryptSync,
	timingSafeEqual,
} from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { parseEnvLines } from "../env/parse-env";
import { FatimaError } from "../lib/error";
import { resolveProjectSecretManagerSettings } from "./project";
import type {
	AccessKeyRecord,
	AuthenticatedAccess,
	EncryptedBlob,
	LocalVaultStoreInput,
	ProjectSecretManagerSettings,
	SecretManagerFormat,
	SecretRecord,
	StoredKeys,
	StoredProjectConfig,
	StoredState,
	StoredVault,
	UnlockedVault,
} from "./types";

const KEY_LENGTH = 32;
const IV_LENGTH = 12;

function base64UrlEncode(value: Buffer): string {
	return value.toString("base64url");
}

function base64UrlDecode(value: string): Buffer {
	return Buffer.from(value, "base64url");
}

function deriveKey(secret: string, salt: string): Buffer {
	return scryptSync(secret, base64UrlDecode(salt), KEY_LENGTH);
}

function encryptBytes(value: Buffer, key: Buffer): EncryptedBlob {
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const ciphertext = Buffer.concat([cipher.update(value), cipher.final()]);
	const tag = cipher.getAuthTag();

	return {
		iv: base64UrlEncode(iv),
		tag: base64UrlEncode(tag),
		ciphertext: base64UrlEncode(ciphertext),
	};
}

function decryptBytes(value: EncryptedBlob, key: Buffer): Buffer {
	try {
		const decipher = createDecipheriv(
			"aes-256-gcm",
			key,
			base64UrlDecode(value.iv),
		);
		decipher.setAuthTag(base64UrlDecode(value.tag));
		return Buffer.concat([
			decipher.update(base64UrlDecode(value.ciphertext)),
			decipher.final(),
		]);
	} catch (error) {
		throw new FatimaError("Failed to decrypt Fatima vault data.", {
			cause: error,
		});
	}
}

function encryptJson<T>(value: T, key: Buffer): EncryptedBlob {
	return encryptBytes(Buffer.from(JSON.stringify(value), "utf8"), key);
}

function decryptJson<T>(value: EncryptedBlob, key: Buffer): T {
	return JSON.parse(decryptBytes(value, key).toString("utf8")) as T;
}

function accessKeySalt(): string {
	return base64UrlEncode(randomBytes(16));
}

function assertNonEmptyPassword(password: string): void {
	if (!password.trim()) {
		throw new FatimaError("Fatima secret manager password cannot be empty.");
	}
}

function writeJsonAtomic(filePath: string, value: unknown): void {
	const tempPath = `${filePath}.${process.pid}.tmp`;
	writeFileSync(tempPath, `${JSON.stringify(value, null, "\t")}\n`, "utf8");
	renameSync(tempPath, filePath);
}

function resolveStoreFiles(project: ProjectSecretManagerSettings) {
	return {
		configPath: path.join(project.storePath, "config.json"),
		keysPath: path.join(project.storePath, "keys.json"),
		statePath: path.join(project.storePath, "state.json"),
		vaultPath: path.join(project.storePath, "vault.enc"),
	};
}

function ensureStoreDirectory(project: ProjectSecretManagerSettings): void {
	mkdirSync(project.storePath, { recursive: true });
}

function readJsonFile<T>(filePath: string, label: string): T {
	try {
		return JSON.parse(readFileSync(filePath, "utf8")) as T;
	} catch (error) {
		throw new FatimaError(`Failed to read ${label} at ${filePath}.`, {
			cause: error,
		});
	}
}

function parseRawAccessKey(rawKey: string): { id: string; secret: string } {
	const match = /^fatima_([A-Za-z0-9_-]+)_([A-Za-z0-9_-]+)$/.exec(
		rawKey.trim(),
	);

	if (!match) {
		throw new FatimaError("Invalid Fatima access key format.");
	}

	return {
		id: match[1],
		secret: match[2],
	};
}

function createRawAccessKey(): { id: string; rawKey: string; secret: string } {
	const id = base64UrlEncode(randomBytes(8));
	const secret = base64UrlEncode(randomBytes(24));
	return {
		id,
		secret,
		rawKey: `fatima_${id}_${secret}`,
	};
}

function getConfigTemplate(
	project: ProjectSecretManagerSettings,
): StoredProjectConfig {
	const now = new Date().toISOString();
	return {
		version: 2,
		mode: "local",
		createdAt: now,
		updatedAt: now,
		defaultEnvironment: project.defaultEnvironment,
		environments: project.environments,
		store: path.basename(project.storePath),
	};
}

function getEmptyState(project: ProjectSecretManagerSettings): StoredState {
	return {
		selectedEnvironment: project.defaultEnvironment,
		showValues: false,
		view: "environment",
	};
}

function toEnvironmentMap(secrets: SecretRecord[]): Record<string, string> {
	return Object.fromEntries(
		secrets.map((secret) => [secret.key, secret.value]),
	) as Record<string, string>;
}

function upsertSecretByKey(
	secrets: SecretRecord[],
	key: string,
	value: string,
): void {
	const existing = secrets.find((secret) => secret.key === key);
	if (existing) {
		existing.value = value;
		return;
	}

	secrets.push({ id: randomUUID(), key, value });
}

export function hasSecretManagerStore(
	configPath?: LocalVaultStoreInput,
): boolean {
	const project = resolveProjectSecretManagerSettings(configPath);
	const files = resolveStoreFiles(project);
	return (
		existsSync(project.storePath) &&
		existsSync(files.configPath) &&
		existsSync(files.keysPath) &&
		existsSync(files.vaultPath)
	);
}

export function initializeSecretManagerStore(
	password: string,
	configPath?: LocalVaultStoreInput,
): { project: ProjectSecretManagerSettings } {
	assertNonEmptyPassword(password);

	const project = resolveProjectSecretManagerSettings(configPath);
	const files = resolveStoreFiles(project);

	if (hasSecretManagerStore(configPath)) {
		throw new FatimaError(
			`Fatima store already exists at ${project.storePath}.`,
		);
	}

	ensureStoreDirectory(project);

	const passwordSalt = accessKeySalt();
	const passwordKey = deriveKey(password, passwordSalt);
	const environmentKeys = Object.fromEntries(
		project.environments.map((environment) => [
			environment,
			randomBytes(KEY_LENGTH),
		]),
	) as Record<string, Buffer>;

	const storedKeys: StoredKeys = {
		primary: {
			salt: passwordSalt,
		},
		environmentKeys: Object.fromEntries(
			Object.entries(environmentKeys).map(([environment, key]) => [
				environment,
				encryptBytes(key, passwordKey),
			]),
		),
		accessKeys: [],
	};

	const vault: StoredVault = {
		version: 2,
		environments: Object.fromEntries(
			Object.entries(environmentKeys).map(([environment, key]) => [
				environment,
				encryptJson<SecretRecord[]>([], key),
			]),
		),
	};

	const config = getConfigTemplate(project);

	writeJsonAtomic(files.configPath, config);
	writeJsonAtomic(files.keysPath, storedKeys);
	writeJsonAtomic(files.vaultPath, vault);
	writeJsonAtomic(files.statePath, getEmptyState(project));

	return { project };
}

function readProjectStore(configPath?: LocalVaultStoreInput): {
	project: ProjectSecretManagerSettings;
	config: StoredProjectConfig;
	keys: StoredKeys;
	vault: StoredVault;
	state: StoredState;
} {
	const project = resolveProjectSecretManagerSettings(configPath);
	const files = resolveStoreFiles(project);

	if (!hasSecretManagerStore(configPath)) {
		throw new FatimaError(
			`Fatima secret manager is not initialized in ${project.storePath}. Open \`fatima\` to initialize it.`,
		);
	}

	return {
		project,
		config: readJsonFile<StoredProjectConfig>(
			files.configPath,
			"Fatima config",
		),
		keys: readJsonFile<StoredKeys>(files.keysPath, "Fatima keys"),
		state: existsSync(files.statePath)
			? readJsonFile<StoredState>(files.statePath, "Fatima state")
			: getEmptyState(project),
		vault: readJsonFile<StoredVault>(files.vaultPath, "Fatima vault"),
	};
}

function assertSupportedStoreVersion(
	store: ReturnType<typeof readProjectStore>,
): void {
	if (store.config.version !== 2 || store.vault.version !== 2) {
		throw new FatimaError(
			"Fatima vault format is no longer supported. Reinitialize the local vault.",
		);
	}
}

export function getSecretManagerSettings(
	configPath?: LocalVaultStoreInput,
): ProjectSecretManagerSettings {
	const store = readProjectStore(configPath);
	assertSupportedStoreVersion(store);
	return {
		defaultEnvironment: store.config.defaultEnvironment,
		environments: [...store.config.environments],
		storePath: store.project.storePath,
	};
}

export function unlockSecretManagerWithPassword(
	password: string,
	configPath?: LocalVaultStoreInput,
): UnlockedVault {
	const store = readProjectStore(configPath);
	assertSupportedStoreVersion(store);
	const passwordKey = deriveKey(password, store.keys.primary.salt);
	const environmentKeys = Object.fromEntries(
		store.config.environments.map((environment) => [
			environment,
			decryptBytes(store.keys.environmentKeys[environment], passwordKey),
		]),
	) as Record<string, Buffer>;
	const vault = Object.fromEntries(
		store.config.environments.map((environment) => {
			const envKey = environmentKeys[environment];
			const envVault = decryptJson<SecretRecord[]>(
				store.vault.environments[environment],
				envKey,
			);
			return [environment, envVault];
		}),
	) as Record<string, SecretRecord[]>;

	return {
		project: store.project,
		config: store.config,
		keys: store.keys,
		vault,
		passwordKey,
		environmentKeys,
	};
}

export function saveUnlockedSecretManager(unlocked: UnlockedVault): void {
	const files = resolveStoreFiles(unlocked.project);
	const vault: StoredVault = {
		version: 2,
		environments: Object.fromEntries(
			Object.entries(unlocked.vault).map(([environment, values]) => {
				const envKey = unlocked.environmentKeys[environment];
				return [environment, encryptJson(values, envKey)];
			}),
		),
	};

	const nextConfig: StoredProjectConfig = {
		...unlocked.config,
		updatedAt: new Date().toISOString(),
	};

	writeJsonAtomic(files.configPath, nextConfig);
	writeJsonAtomic(files.keysPath, unlocked.keys);
	writeJsonAtomic(files.vaultPath, vault);
	writeJsonAtomic(files.statePath, getEmptyState(unlocked.project));
	unlocked.config = nextConfig;
}

export function createEnvironment(
	unlocked: UnlockedVault,
	environment: string,
): void {
	const normalized = environment.trim();

	if (!normalized) {
		throw new FatimaError("Environment name cannot be empty.");
	}

	if (unlocked.config.environments.includes(normalized)) {
		throw new FatimaError(`Fatima environment already exists: ${normalized}`);
	}

	const environmentKey = randomBytes(KEY_LENGTH);
	unlocked.environmentKeys[normalized] = environmentKey;
	unlocked.keys.environmentKeys[normalized] = encryptBytes(
		environmentKey,
		unlocked.passwordKey,
	);
	unlocked.vault[normalized] = [];
	unlocked.config.environments = [...unlocked.config.environments, normalized];
	unlocked.project.environments = [...unlocked.config.environments];

	if (!unlocked.config.defaultEnvironment) {
		unlocked.config.defaultEnvironment = normalized;
		unlocked.project.defaultEnvironment = normalized;
	}
}

export function renameEnvironment(
	unlocked: UnlockedVault,
	currentEnvironment: string,
	nextEnvironment: string,
): void {
	const current = currentEnvironment.trim();
	const next = nextEnvironment.trim();

	if (!current) {
		throw new FatimaError("Current environment name cannot be empty.");
	}

	if (!next) {
		throw new FatimaError("Environment name cannot be empty.");
	}

	if (!unlocked.config.environments.includes(current)) {
		throw new FatimaError(`Unknown Fatima environment: ${current}`);
	}

	if (current !== next && unlocked.config.environments.includes(next)) {
		throw new FatimaError(`Fatima environment already exists: ${next}`);
	}

	if (current === next) {
		return;
	}

	unlocked.vault[next] = unlocked.vault[current] ?? [];
	delete unlocked.vault[current];
	const environmentKey = unlocked.environmentKeys[current];
	delete unlocked.environmentKeys[current];
	unlocked.environmentKeys[next] = environmentKey;
	const wrappedEnvironmentKey = unlocked.keys.environmentKeys[current];
	delete unlocked.keys.environmentKeys[current];
	unlocked.keys.environmentKeys[next] = wrappedEnvironmentKey;
	unlocked.config.environments = unlocked.config.environments.map(
		(environment) => (environment === current ? next : environment),
	);
	unlocked.project.environments = [...unlocked.config.environments];

	if (unlocked.config.defaultEnvironment === current) {
		unlocked.config.defaultEnvironment = next;
		unlocked.project.defaultEnvironment = next;
	}

	for (const accessKey of unlocked.keys.accessKeys) {
		if (accessKey.wrappedEnvironmentKeys[current]) {
			accessKey.wrappedEnvironmentKeys[next] =
				accessKey.wrappedEnvironmentKeys[current];
			delete accessKey.wrappedEnvironmentKeys[current];
		}
	}
}

export function deleteEnvironment(
	unlocked: UnlockedVault,
	environment: string,
): string {
	const normalized = environment.trim();

	if (!unlocked.config.environments.includes(normalized)) {
		throw new FatimaError(`Unknown Fatima environment: ${normalized}`);
	}

	if (unlocked.config.environments.length <= 1) {
		throw new FatimaError("Fatima vault must keep at least one environment.");
	}

	delete unlocked.vault[normalized];
	delete unlocked.environmentKeys[normalized];
	delete unlocked.keys.environmentKeys[normalized];
	unlocked.config.environments = unlocked.config.environments.filter(
		(value) => value !== normalized,
	);
	unlocked.project.environments = [...unlocked.config.environments];

	for (const accessKey of unlocked.keys.accessKeys) {
		delete accessKey.wrappedEnvironmentKeys[normalized];
	}
	unlocked.keys.accessKeys = unlocked.keys.accessKeys.filter(
		(accessKey) => Object.keys(accessKey.wrappedEnvironmentKeys).length > 0,
	);

	const nextDefault =
		unlocked.config.defaultEnvironment === normalized
			? (unlocked.config.environments[0] ?? "")
			: unlocked.config.defaultEnvironment;
	unlocked.config.defaultEnvironment = nextDefault;
	unlocked.project.defaultEnvironment = nextDefault;
	return nextDefault;
}

export function changeVaultPassword(
	unlocked: UnlockedVault,
	password: string,
): void {
	assertNonEmptyPassword(password);

	const passwordSalt = accessKeySalt();
	const passwordKey = deriveKey(password, passwordSalt);
	const nextEnvironmentKeys = Object.fromEntries(
		unlocked.config.environments.map((environment) => [
			environment,
			randomBytes(KEY_LENGTH),
		]),
	) as Record<string, Buffer>;

	unlocked.environmentKeys = nextEnvironmentKeys;
	unlocked.passwordKey = passwordKey;
	unlocked.keys.primary = {
		salt: passwordSalt,
	};
	unlocked.keys.environmentKeys = Object.fromEntries(
		Object.entries(nextEnvironmentKeys).map(([environment, key]) => [
			environment,
			encryptBytes(key, passwordKey),
		]),
	);

	unlocked.keys.accessKeys = [];
}

export function setSecretValue(
	unlocked: UnlockedVault,
	environment: string,
	key: string,
	value: string,
	options?: { id?: string },
): void {
	if (!key.trim()) {
		throw new FatimaError("Secret key cannot be empty.");
	}

	unlocked.vault[environment] ??= [];
	const secrets = unlocked.vault[environment] ?? [];
	const existing = options?.id
		? secrets.find((secret) => secret.id === options.id)
		: undefined;

	if (existing) {
		existing.key = key;
		existing.value = value;
		return;
	}

	secrets.push({ id: randomUUID(), key, value });
	unlocked.vault[environment] = secrets;
}

export function deleteSecretValue(
	unlocked: UnlockedVault,
	environment: string,
	id: string,
): void {
	unlocked.vault[environment] = (unlocked.vault[environment] ?? []).filter(
		(secret) => secret.id !== id,
	);
}

export function importEnvFileIntoVault(
	unlocked: UnlockedVault,
	environment: string,
	filePath: string,
): number {
	const content = readFileSync(path.resolve(process.cwd(), filePath), "utf8");
	const parsed = parseEnvLines(content);
	unlocked.vault[environment] ??= [];
	for (const [key, value] of Object.entries(parsed)) {
		upsertSecretByKey(unlocked.vault[environment], key, value);
	}
	return Object.keys(parsed).length;
}

function authenticateAccessKey(
	rawKey: string,
	configPath?: LocalVaultStoreInput,
): {
	store: ReturnType<typeof readProjectStore>;
	auth: AuthenticatedAccess;
} {
	const store = readProjectStore(configPath);
	assertSupportedStoreVersion(store);
	const { id, secret } = parseRawAccessKey(rawKey);
	const record = store.keys.accessKeys.find((entry) => entry.id === id);

	if (!record) {
		throw new FatimaError("Fatima access key not found.");
	}

	const derivedKey = deriveKey(secret, record.salt);

	const environmentKeys = Object.fromEntries(
		Object.entries(record.wrappedEnvironmentKeys).flatMap(
			([environment, encrypted]) => {
				if (!store.config.environments.includes(environment)) {
					return [];
				}

				if (!encrypted) {
					throw new FatimaError(
						`Fatima access key is missing metadata for ${environment}.`,
					);
				}

				return [[environment, decryptBytes(encrypted, derivedKey)]];
			},
		),
	) as Record<string, Buffer>;

	return {
		store,
		auth: {
			kind: "access",
			record,
			environmentKeys,
		},
	};
}

function resolveRequestedEnvironment(
	store: ReturnType<typeof readProjectStore>,
	environment?: string,
): string {
	const resolved = environment ?? store.config.defaultEnvironment;

	if (!store.config.environments.includes(resolved)) {
		throw new FatimaError(`Unknown Fatima environment: ${resolved}`);
	}

	return resolved;
}

function getEnvironmentValuesForAccess(
	rawKey: string,
	environment?: string,
	configPath?: LocalVaultStoreInput,
): {
	environment: string;
	values: Record<string, string>;
	store: ReturnType<typeof readProjectStore>;
	access: AuthenticatedAccess;
} {
	const { store, auth } = authenticateAccessKey(rawKey, configPath);
	const selectedEnvironment = resolveRequestedEnvironment(store, environment);

	if (!auth.environmentKeys[selectedEnvironment]) {
		throw new FatimaError(
			`Fatima access key cannot access environment: ${selectedEnvironment}`,
		);
	}

	const envKey = auth.environmentKeys[selectedEnvironment];

	return {
		environment: selectedEnvironment,
		values: toEnvironmentMap(
			decryptJson<SecretRecord[]>(
				store.vault.environments[selectedEnvironment],
				envKey,
			),
		),
		store,
		access: auth,
	};
}

export function listSecretsWithAccessKey(
	rawKey: string,
	options?: { config?: LocalVaultStoreInput; environment?: string },
): { environment: string; secrets: Record<string, string> } {
	const result = getEnvironmentValuesForAccess(
		rawKey,
		options?.environment,
		options?.config,
	);

	return {
		environment: result.environment,
		secrets: result.values,
	};
}

export function listAccessKeyEnvironments(
	rawKey: string,
	options?: { config?: LocalVaultStoreInput },
): string[] {
	const { auth } = authenticateAccessKey(rawKey, options?.config);
	return Object.keys(auth.environmentKeys);
}

export function generateSecondaryAccessKey(
	source: string | UnlockedVault,
	name: string,
	environments: string[],
	options?: { config?: LocalVaultStoreInput },
): { key: string; record: AccessKeyRecord } {
	const unlocked =
		typeof source === "string"
			? unlockSecretManagerWithPassword(source, options?.config)
			: source;

	if (!name.trim()) {
		throw new FatimaError("Fatima access key name cannot be empty.");
	}

	const selectedEnvironments = Array.from(new Set(environments));

	if (selectedEnvironments.length === 0) {
		throw new FatimaError(
			"Select at least one environment for the Fatima key.",
		);
	}

	for (const environment of selectedEnvironments) {
		if (!unlocked.config.environments.includes(environment)) {
			throw new FatimaError(`Unknown Fatima environment: ${environment}`);
		}
	}

	const nextKey = createRawAccessKey();
	const salt = accessKeySalt();
	const wrappingKey = deriveKey(nextKey.secret, salt);
	const wrappedEnvironmentKeys = Object.fromEntries(
		selectedEnvironments.map((environment) => {
			const envKey = unlocked.environmentKeys[environment];
			return [environment, encryptBytes(envKey, wrappingKey)];
		}),
	);

	const record: AccessKeyRecord = {
		id: nextKey.id,
		name,
		salt,
		wrappedEnvironmentKeys,
	};

	unlocked.keys.accessKeys.push(record);
	const files = resolveStoreFiles(unlocked.project);
	writeJsonAtomic(files.keysPath, unlocked.keys);

	return { key: nextKey.rawKey, record };
}

function shellEscape(value: string): string {
	return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function formatGithubEnvRecord(key: string, value: string): string {
	if (value.includes("\n")) {
		return `${key}<<FATIMA_EOF\n${value}\nFATIMA_EOF`;
	}

	return `${key}=${value}`;
}

export function formatSecretsWithAccessKey(
	format: SecretManagerFormat,
	rawKey: string,
	options?: { config?: LocalVaultStoreInput; environment?: string },
): { environment: string; content: string } {
	const { environment, values } = getEnvironmentValuesForAccess(
		rawKey,
		options?.environment,
		options?.config,
	);
	const entries = Object.entries(values).sort(([a], [b]) => a.localeCompare(b));

	if (format === "json") {
		return {
			environment,
			content: `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`,
		};
	}

	if (format === "shell") {
		return {
			environment,
			content: `${entries.map(([key, value]) => `export ${key}=${shellEscape(value)}`).join("\n")}\n`,
		};
	}

	if (format === "github-env") {
		return {
			environment,
			content: `${entries.map(([key, value]) => formatGithubEnvRecord(key, value)).join("\n")}\n`,
		};
	}

	return {
		environment,
		content: `${entries.map(([key, value]) => `${key}=${value}`).join("\n")}\n`,
	};
}

export function resolveDefaultAccessKey(
	providedKey?: string,
): string | undefined {
	return (
		providedKey?.trim() || process.env.FATIMA_ACCESS_KEY?.trim() || undefined
	);
}

export function resolveDefaultVaultPassword(
	providedPassword?: string,
): string | undefined {
	return (
		providedPassword?.trim() || process.env.FATIMA_PASSWORD?.trim() || undefined
	);
}

export function compareAccessKey(rawKey: string, other: string): boolean {
	const left = Buffer.from(rawKey);
	const right = Buffer.from(other);
	return left.length === right.length && timingSafeEqual(left, right);
}
