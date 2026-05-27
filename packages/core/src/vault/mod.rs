mod access_key;
mod crypto;
mod domain;
mod environments;
mod key_management;
mod password;
mod persistence;
mod secrets;
mod store;
mod types;
mod vault;

pub use types::{
    AccessKeyRecord, EncryptedBlob, FatimaVaultSnapshot, GeneratedAccessKey, PrimaryKeyRecord,
    ProjectSecretManagerSettings, SecretRecord, StoredKeys, StoredProjectConfig, StoredVault,
    VaultOptions,
};
pub use vault::FatimaVault;
