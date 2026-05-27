use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

use crate::{FatimaError, Result};

use super::crypto::{derive_key, encrypt_bytes, encrypt_json, random_b64, random_bytes};
use super::domain::assert_non_empty_password;
use super::types::{
    PrimaryKeyRecord, ProjectSecretManagerSettings, ProjectStore, ResolvedSettings, SecretRecord,
    StoreFiles, StoredKeys, StoredProjectConfig, StoredVault, UnlockedVault, VaultOptions,
    DEFAULT_ENVIRONMENTS, DEFAULT_STORE_PATH, KEY_LENGTH,
};

pub(crate) fn has_store(options: Option<&VaultOptions>) -> bool {
    let project = resolve_settings(options);
    let files = StoreFiles::new(&project);
    project.store_path.exists()
        && files.config_path.exists()
        && files.keys_path.exists()
        && files.vault_path.exists()
}

pub(crate) fn get_settings(options: Option<&VaultOptions>) -> Result<ProjectSecretManagerSettings> {
    let store = read_store(options)?;
    assert_supported_store(&store)?;
    Ok(ProjectSecretManagerSettings {
        default_environment: store.config.default_environment,
        environments: store.config.environments,
        store_path: store.project.store_path.display().to_string(),
    })
}

pub(crate) fn initialize_store(password: &str, options: &VaultOptions) -> Result<UnlockedVault> {
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
    let files = StoreFiles::new(&project);
    let salt = random_b64(16);
    let password_key = derive_key(password, &salt)?;
    let environments = DEFAULT_ENVIRONMENTS
        .iter()
        .map(|value| value.to_string())
        .collect::<Vec<_>>();
    let environment_keys = environments
        .iter()
        .map(|environment| (environment.clone(), random_bytes(KEY_LENGTH)))
        .collect::<BTreeMap<_, _>>();
    let keys = StoredKeys {
        primary: PrimaryKeyRecord { salt },
        environment_keys: environment_keys
            .iter()
            .map(|(environment, key)| Ok((environment.clone(), encrypt_bytes(key, &password_key)?)))
            .collect::<Result<_>>()?,
        access_keys: Vec::new(),
    };
    let vault = StoredVault {
        version: 2,
        environments: environment_keys
            .iter()
            .map(|(environment, key)| {
                Ok((
                    environment.clone(),
                    encrypt_json(&Vec::<SecretRecord>::new(), key)?,
                ))
            })
            .collect::<Result<_>>()?,
    };
    let now = now()?;
    let config = StoredProjectConfig {
        version: 2,
        mode: "local".to_string(),
        created_at: now.clone(),
        updated_at: now,
        default_environment: "development".to_string(),
        environments,
        store: project
            .store_path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or(DEFAULT_STORE_PATH)
            .to_string(),
    };
    write_json(&files.config_path, &config)?;
    write_json(&files.keys_path, &keys)?;
    write_json(&files.vault_path, &vault)?;
    write_json(
        &files.state_path,
        &serde_json::json!({
            "selectedEnvironment": config.default_environment,
            "showValues": false,
            "view": "environment"
        }),
    )?;
    let vault = environment_keys
        .keys()
        .map(|environment| (environment.clone(), Vec::<SecretRecord>::new()))
        .collect();
    Ok(UnlockedVault {
        project: ProjectSecretManagerSettings {
            default_environment: config.default_environment.clone(),
            environments: config.environments.clone(),
            store_path: project.store_path.display().to_string(),
        },
        config,
        keys,
        vault,
        password_key,
        environment_keys,
    })
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
    let config_path = store_path.join("config.json");
    if let Ok(content) = fs::read_to_string(&config_path) {
        if serde_json::from_str::<StoredProjectConfig>(&content).is_ok() {
            return ResolvedSettings { store_path };
        }
    }
    ResolvedSettings { store_path }
}

pub(crate) fn read_store(options: Option<&VaultOptions>) -> Result<ProjectStore> {
    let project = resolve_settings(options);
    let files = StoreFiles::new(&project);
    if !project.store_path.exists()
        || !files.config_path.exists()
        || !files.keys_path.exists()
        || !files.vault_path.exists()
    {
        return Err(FatimaError::message(format!(
            "Fatima secret manager is not initialized in {}. Open `fatima` to initialize it.",
            project.store_path.display()
        )));
    }
    Ok(ProjectStore {
        project: project.clone(),
        config: read_json(&files.config_path, "Fatima config")?,
        keys: read_json(&files.keys_path, "Fatima keys")?,
        vault: read_json(&files.vault_path, "Fatima vault")?,
    })
}

pub(crate) fn assert_supported_store(store: &ProjectStore) -> Result<()> {
    if store.config.version != 2 || store.vault.version != 2 {
        return Err(FatimaError::message(
            "Fatima vault format is no longer supported. Reinitialize the local vault.",
        ));
    }
    Ok(())
}

pub(crate) fn unlock_store(
    password: &str,
    options: Option<&VaultOptions>,
) -> Result<UnlockedVault> {
    let store = read_store(options)?;
    assert_supported_store(&store)?;
    let password_key = derive_key(password, &store.keys.primary.salt)?;
    let environment_keys = store
        .config
        .environments
        .iter()
        .map(|environment| {
            let encrypted = store
                .keys
                .environment_keys
                .get(environment)
                .ok_or_else(|| {
                    FatimaError::message(format!("Missing environment key: {environment}"))
                })?;
            Ok((
                environment.clone(),
                super::crypto::decrypt_bytes(encrypted, &password_key)?,
            ))
        })
        .collect::<Result<BTreeMap<_, _>>>()?;
    let vault = store
        .config
        .environments
        .iter()
        .map(|environment| {
            let encrypted = store.vault.environments.get(environment).ok_or_else(|| {
                FatimaError::message(format!("Missing vault environment: {environment}"))
            })?;
            let key = environment_keys.get(environment).ok_or_else(|| {
                FatimaError::message(format!("Missing environment key: {environment}"))
            })?;
            Ok((
                environment.clone(),
                super::crypto::decrypt_json::<Vec<SecretRecord>>(encrypted, key)?,
            ))
        })
        .collect::<Result<BTreeMap<_, _>>>()?;
    Ok(UnlockedVault {
        project: ProjectSecretManagerSettings {
            default_environment: store.config.default_environment.clone(),
            environments: store.config.environments.clone(),
            store_path: store.project.store_path.display().to_string(),
        },
        config: store.config,
        keys: store.keys,
        vault,
        password_key,
        environment_keys,
    })
}

pub(crate) fn save_unlocked(unlocked: &mut UnlockedVault) -> Result<()> {
    unlocked.config.updated_at = now()?;
    let project = ResolvedSettings {
        store_path: PathBuf::from(&unlocked.project.store_path),
    };
    let files = StoreFiles::new(&project);
    let vault = StoredVault {
        version: 2,
        environments: unlocked
            .vault
            .iter()
            .map(|(environment, secrets)| {
                let key = unlocked.environment_keys.get(environment).ok_or_else(|| {
                    FatimaError::message(format!("Missing environment key: {environment}"))
                })?;
                Ok((environment.clone(), encrypt_json(secrets, key)?))
            })
            .collect::<Result<_>>()?,
    };
    write_json(&files.config_path, &unlocked.config)?;
    write_json(&files.keys_path, &unlocked.keys)?;
    write_json(&files.vault_path, &vault)?;
    write_json(
        &files.state_path,
        &serde_json::json!({
            "selectedEnvironment": unlocked.config.default_environment,
            "showValues": false,
            "view": "environment"
        }),
    )?;
    Ok(())
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &Path, label: &str) -> Result<T> {
    let content = fs::read_to_string(path).map_err(|source| FatimaError::ReadFile {
        path: path.display().to_string(),
        source,
    })?;
    serde_json::from_str(&content).map_err(|source| FatimaError::ParseJson {
        path: label.to_string(),
        source,
    })
}

fn write_json(path: &Path, value: &impl Serialize) -> Result<()> {
    let content = serde_json::to_string_pretty(value)
        .map_err(|error| FatimaError::message(error.to_string()))?;
    fs::write(path, content).map_err(|source| FatimaError::WriteFile {
        path: path.display().to_string(),
        source,
    })
}

fn now() -> Result<String> {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .map_err(|error| FatimaError::message(error.to_string()))
}
