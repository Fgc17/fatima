use std::collections::BTreeMap;

use crate::env::Secrets;
use crate::{FatimaError, Result};

use super::crypto::{decrypt_bytes, decrypt_json, derive_key, random_b64};
use super::domain::{assert_environment, to_environment_map};
use super::store::{assert_supported_store, read_store};
use super::types::{
    AccessKeyRecord, GeneratedAccessKey, ProjectStore, SecretRecord, VaultOptions,
    ACCESS_KEY_ID_LENGTH, ACCESS_KEY_PREFIX,
};

pub(crate) fn authenticate_access_key(
    raw_key: &str,
    options: Option<&VaultOptions>,
) -> Result<(ProjectStore, BTreeMap<String, Vec<u8>>)> {
    let store = read_store(options)?;
    assert_supported_store(&store)?;
    let (id, secret) = parse_raw_access_key(raw_key)?;
    let record = store
        .keys
        .access_keys
        .iter()
        .find(|record| record.id == id)
        .ok_or_else(|| FatimaError::message("Fatima access key not found."))?;
    let derived_key = derive_key(&secret, &record.salt)?;
    let environment_keys = record
        .wrapped_environment_keys
        .iter()
        .filter(|(environment, _)| store.config.environments.contains(environment))
        .map(|(environment, encrypted)| {
            Ok((environment.clone(), decrypt_bytes(encrypted, &derived_key)?))
        })
        .collect::<Result<BTreeMap<_, _>>>()?;
    Ok((store, environment_keys))
}

pub(crate) fn list_secrets_with_access_key(
    raw_key: &str,
    environment: Option<&str>,
    options: Option<&VaultOptions>,
) -> Result<Secrets> {
    let (store, environment_keys) = authenticate_access_key(raw_key, options)?;
    let environment = environment.unwrap_or(&store.config.default_environment);
    assert_environment(&store.config, environment)?;
    let key = environment_keys.get(environment).ok_or_else(|| {
        FatimaError::message(format!(
            "Fatima access key cannot access environment: {environment}"
        ))
    })?;
    let encrypted =
        store.vault.environments.get(environment).ok_or_else(|| {
            FatimaError::message(format!("Missing vault environment: {environment}"))
        })?;
    Ok(to_environment_map(decrypt_json::<Vec<SecretRecord>>(
        encrypted, key,
    )?))
}

pub(crate) fn list_access_key_environments(
    raw_key: &str,
    options: Option<&VaultOptions>,
) -> Result<Vec<String>> {
    let (_, environment_keys) = authenticate_access_key(raw_key, options)?;
    Ok(environment_keys.keys().cloned().collect())
}

pub(crate) fn create_access_key_record(
    name: &str,
    environments: &[String],
    environment_keys: &BTreeMap<String, Vec<u8>>,
) -> Result<GeneratedAccessKey> {
    let (id, secret, raw_key) = create_raw_access_key();
    let salt = random_b64(16);
    let wrapping_key = derive_key(&secret, &salt)?;
    let wrapped_environment_keys = environments
        .iter()
        .map(|environment| {
            let key = environment_keys.get(environment).ok_or_else(|| {
                FatimaError::message(format!("Missing environment key: {environment}"))
            })?;
            Ok((
                environment.clone(),
                super::crypto::encrypt_bytes(key, &wrapping_key)?,
            ))
        })
        .collect::<Result<_>>()?;
    let record = AccessKeyRecord {
        id,
        name: name.to_string(),
        salt,
        wrapped_environment_keys,
    };
    Ok(GeneratedAccessKey {
        key: raw_key,
        record,
    })
}

fn parse_raw_access_key(raw_key: &str) -> Result<(String, String)> {
    let value = raw_key.trim();
    if !value.starts_with(ACCESS_KEY_PREFIX) {
        return Err(FatimaError::message("Invalid Fatima access key format."));
    }
    let payload = &value[ACCESS_KEY_PREFIX.len()..];
    if payload.len() <= ACCESS_KEY_ID_LENGTH || payload.as_bytes()[ACCESS_KEY_ID_LENGTH] != b'_' {
        return Err(FatimaError::message("Invalid Fatima access key format."));
    }
    let id = &payload[..ACCESS_KEY_ID_LENGTH];
    let secret = &payload[ACCESS_KEY_ID_LENGTH + 1..];
    if !is_base64urlish(id) || !is_base64urlish(secret) {
        return Err(FatimaError::message("Invalid Fatima access key format."));
    }
    Ok((id.to_string(), secret.to_string()))
}

fn create_raw_access_key() -> (String, String, String) {
    let id = random_b64(8);
    let secret = random_b64(24);
    let raw_key = format!("{ACCESS_KEY_PREFIX}{id}_{secret}");
    (id, secret, raw_key)
}

fn is_base64urlish(value: &str) -> bool {
    !value.is_empty()
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'-')
}
