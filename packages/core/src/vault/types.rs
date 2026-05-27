use std::collections::BTreeMap;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

pub(crate) const DEFAULT_STORE_PATH: &str = ".fatima";
pub(crate) const DEFAULT_ENVIRONMENTS: [&str; 3] = ["development", "staging", "production"];
pub(crate) const KEY_LENGTH: usize = 32;
pub(crate) const ACCESS_KEY_PREFIX: &str = "fatima_";
pub(crate) const ACCESS_KEY_ID_LENGTH: usize = 11;

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultOptions {
    #[serde(default)]
    pub cwd: Option<String>,
    #[serde(default, alias = "store-path")]
    pub store_path: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSecretManagerSettings {
    pub default_environment: String,
    pub environments: Vec<String>,
    pub store_path: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct EncryptedBlob {
    pub iv: String,
    pub tag: String,
    pub ciphertext: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredProjectConfig {
    pub version: u8,
    pub mode: String,
    pub created_at: String,
    pub updated_at: String,
    pub default_environment: String,
    pub environments: Vec<String>,
    pub store: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PrimaryKeyRecord {
    pub salt: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccessKeyRecord {
    pub id: String,
    pub name: String,
    pub salt: String,
    pub wrapped_environment_keys: BTreeMap<String, EncryptedBlob>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredKeys {
    pub primary: PrimaryKeyRecord,
    pub environment_keys: BTreeMap<String, EncryptedBlob>,
    pub access_keys: Vec<AccessKeyRecord>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct StoredVault {
    pub version: u8,
    pub environments: BTreeMap<String, EncryptedBlob>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SecretRecord {
    pub id: String,
    pub key: String,
    pub value: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct FatimaVaultSnapshot {
    pub project: ProjectSecretManagerSettings,
    pub config: StoredProjectConfig,
    pub keys: StoredKeys,
    pub vault: BTreeMap<String, Vec<SecretRecord>>,
}

#[derive(Clone, Debug, Serialize)]
pub struct GeneratedAccessKey {
    pub key: String,
    pub record: AccessKeyRecord,
}

#[derive(Clone, Debug)]
pub(crate) enum FatimaVaultSession {
    Password(UnlockedVault),
    Key {
        raw_key: String,
        environments: Vec<String>,
    },
}

#[derive(Clone, Debug)]
pub(crate) struct UnlockedVault {
    pub project: ProjectSecretManagerSettings,
    pub config: StoredProjectConfig,
    pub keys: StoredKeys,
    pub vault: BTreeMap<String, Vec<SecretRecord>>,
    pub password_key: Vec<u8>,
    pub environment_keys: BTreeMap<String, Vec<u8>>,
}

pub(crate) struct ProjectStore {
    pub project: ResolvedSettings,
    pub config: StoredProjectConfig,
    pub keys: StoredKeys,
    pub vault: StoredVault,
}

#[derive(Clone)]
pub(crate) struct ResolvedSettings {
    pub store_path: PathBuf,
}

pub(crate) struct StoreFiles {
    pub config_path: PathBuf,
    pub keys_path: PathBuf,
    pub state_path: PathBuf,
    pub vault_path: PathBuf,
}

impl StoreFiles {
    pub fn new(project: &ResolvedSettings) -> Self {
        Self {
            config_path: project.store_path.join("config.json"),
            keys_path: project.store_path.join("keys.json"),
            state_path: project.store_path.join("state.json"),
            vault_path: project.store_path.join("vault.enc"),
        }
    }
}
