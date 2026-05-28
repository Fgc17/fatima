use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

use crate::{FatimaError, Result};

use super::crypto::{derive_key, encrypt_json, random_b64};
use super::domain::assert_non_empty_password;
use super::types::{
    ProjectSecretManagerSettings, ProjectStore, ResolvedSettings, StoreFiles, StoredProjectConfig,
    StoredVaultData, StoredVaultFile, VaultEncryption, VaultKdf, VaultOptions,
    DEFAULT_ENVIRONMENTS, DEFAULT_STORE_PATH,
};

pub(crate) fn has_store(options: Option<&VaultOptions>) -> bool {
    let project = resolve_settings(options);
    StoreFiles::new(&project).vault_path.exists()
}

pub(crate) fn get_settings(options: Option<&VaultOptions>) -> Result<ProjectSecretManagerSettings> {
    let store = read_store(options)?;
    assert_supported_store(&store)?;
    Ok(ProjectSecretManagerSettings {
        default_environment: store.file.default_environment,
        environments: store.file.environments,
        store_path: resolve_settings(options).store_path.display().to_string(),
    })
}

pub(crate) fn initialize_store(
    password: &str,
    options: &VaultOptions,
) -> Result<super::types::UnlockedVault> {
    assert_non_empty_password(password)?;
    let project = resolve_settings(Some(options));
    if has_store(Some(options)) {
        return Err(FatimaError::message(format!(
            "Fatima store already exists at {}.",
            project.store_path.display()
        )));
    }

    fs::create_dir_all(&project.store_path).map_err(|source| FatimaError::WriteFile {
        path: project.store_path.display().to_string(),
        source,
    })?;
    let now = now()?;
    let environments = DEFAULT_ENVIRONMENTS
        .iter()
        .map(|value| value.to_string())
        .collect::<Vec<_>>();
    let data = StoredVaultData {
        default_environment: "development".to_string(),
        environments: environments.clone(),
        secrets: Vec::new(),
    };
    let salt = random_b64(16);
    let password_key = derive_key(password, &salt)?;
    let file = StoredVaultFile {
        version: 1,
        mode: "local".to_string(),
        created_at: now.clone(),
        updated_at: now,
        default_environment: data.default_environment.clone(),
        environments: data.environments.clone(),
        access_keys: Vec::new(),
        kdf: VaultKdf {
            algorithm: "scrypt".to_string(),
            salt,
        },
        encryption: VaultEncryption {
            algorithm: "aes-256-gcm".to_string(),
        },
        data: encrypt_json(&data, &password_key)?,
    };
    let files = StoreFiles::new(&project);
    write_json(&files.vault_path, &file)?;
    Ok(unlocked(project, file, data, password_key))
}

pub(crate) fn resolve_settings(options: Option<&VaultOptions>) -> ResolvedSettings {
    let cwd = options
        .and_then(|options| options.cwd.as_ref())
        .map(PathBuf::from)
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    let store_path = options
        .and_then(|options| options.store_path.as_ref())
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(DEFAULT_STORE_PATH));
    let store_path = if store_path.is_absolute() {
        store_path
    } else {
        cwd.join(store_path)
    };
    ResolvedSettings { store_path }
}

pub(crate) fn read_store(options: Option<&VaultOptions>) -> Result<ProjectStore> {
    let project = resolve_settings(options);
    let files = StoreFiles::new(&project);
    if !project.store_path.exists() || !files.vault_path.exists() {
        return Err(FatimaError::message(format!(
            "Fatima secret manager is not initialized in {}. Open `fatima` to initialize it.",
            project.store_path.display()
        )));
    }
    Ok(ProjectStore {
        project,
        file: read_json(&files.vault_path, "Fatima vault")?,
    })
}

pub(crate) fn assert_supported_store(store: &ProjectStore) -> Result<()> {
    if store.file.version != 1 {
        return Err(FatimaError::message(
            "Fatima vault format is no longer supported. Delete and reinitialize the local vault.",
        ));
    }
    Ok(())
}

pub(crate) fn unlock_store(
    password: &str,
    options: Option<&VaultOptions>,
) -> Result<super::types::UnlockedVault> {
    let store = read_store(options)?;
    assert_supported_store(&store)?;
    let password_key = derive_key(password, &store.file.kdf.salt)?;
    let data = super::crypto::decrypt_json::<StoredVaultData>(&store.file.data, &password_key)?;
    Ok(unlocked(store.project, store.file, data, password_key))
}

pub(crate) fn save_unlocked(unlocked: &mut super::types::UnlockedVault) -> Result<()> {
    unlocked.file.updated_at = now()?;
    unlocked.file.default_environment = unlocked.data.default_environment.clone();
    unlocked.file.environments = unlocked.data.environments.clone();
    unlocked.file.access_keys = unlocked.access_keys.clone();
    unlocked.config.updated_at = unlocked.file.updated_at.clone();
    unlocked.file.data = encrypt_json(&unlocked.data, &unlocked.password_key)?;
    let project = ResolvedSettings {
        store_path: PathBuf::from(&unlocked.project.store_path),
    };
    write_json(&StoreFiles::new(&project).vault_path, &unlocked.file)
}

fn unlocked(
    project: ResolvedSettings,
    file: StoredVaultFile,
    data: StoredVaultData,
    password_key: Vec<u8>,
) -> super::types::UnlockedVault {
    let store_name = project
        .store_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or(DEFAULT_STORE_PATH)
        .to_string();
    let config = StoredProjectConfig {
        version: file.version,
        mode: file.mode.clone(),
        created_at: file.created_at.clone(),
        updated_at: file.updated_at.clone(),
        default_environment: data.default_environment.clone(),
        environments: data.environments.clone(),
        store: store_name,
    };
    let access_keys = file.access_keys.clone();
    super::types::UnlockedVault {
        project: ProjectSecretManagerSettings {
            default_environment: data.default_environment.clone(),
            environments: data.environments.clone(),
            store_path: project.store_path.display().to_string(),
        },
        file,
        config,
        data,
        access_keys,
        password_key,
    }
}

fn now() -> Result<String> {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .map_err(|error| FatimaError::message(error.to_string()))
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &std::path::Path, label: &str) -> Result<T> {
    let content = fs::read_to_string(path).map_err(|source| FatimaError::ReadFile {
        path: path.display().to_string(),
        source,
    })?;
    serde_json::from_str(&content)
        .map_err(|error| FatimaError::message(format!("Invalid {label}: {error}")))
}

fn write_json<T: Serialize>(path: &std::path::Path, value: &T) -> Result<()> {
    let content = serde_json::to_string_pretty(value)
        .map_err(|error| FatimaError::message(error.to_string()))?;
    fs::write(path, format!("{content}\n")).map_err(|source| FatimaError::WriteFile {
        path: path.display().to_string(),
        source,
    })
}
