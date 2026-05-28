use crate::env::Secrets;
use crate::{FatimaError, Result};

use super::crypto::{decrypt_bytes, derive_key, encode_b64, encrypt_bytes, random_b64};
use super::domain::{assert_environment, to_environment_map};
use super::store::{assert_supported_store, read_store};
use super::types::{
    AccessKeyRecord, GeneratedAccessKey, VaultOptions, ACCESS_KEY_ID_LENGTH, ACCESS_KEY_PREFIX,
};

pub(crate) fn list_secrets_with_access_key(
    raw_key: &str,
    environment: Option<&str>,
    options: Option<&VaultOptions>,
) -> Result<Secrets> {
    let (data, environments) = authenticate_access_key(raw_key, options)?;
    let environment = environment.unwrap_or(&data.default_environment);
    if !data.environments.iter().any(|value| value == environment) {
        return Err(FatimaError::message(format!(
            "Unknown Fatima environment: {environment}"
        )));
    }
    if !environments.iter().any(|value| value == environment) {
        return Err(FatimaError::message(format!(
            "Fatima access key cannot access environment: {environment}"
        )));
    }
    Ok(to_environment_map(&data.secrets, environment))
}

pub(crate) fn list_access_key_environments(
    raw_key: &str,
    options: Option<&VaultOptions>,
) -> Result<Vec<String>> {
    let (_, environments) = authenticate_access_key(raw_key, options)?;
    Ok(environments)
}

fn authenticate_access_key(
    raw_key: &str,
    options: Option<&VaultOptions>,
) -> Result<(super::types::StoredVaultData, Vec<String>)> {
    let store = read_store(options)?;
    assert_supported_store(&store)?;
    let (id, secret) = parse_raw_access_key(raw_key)?;
    let record = store
        .file
        .access_keys
        .iter()
        .find(|record| record.id == id)
        .ok_or_else(|| FatimaError::message("Fatima access key not found."))?;
    let access_key = derive_key(&secret, &record.salt)?;
    let derived = encode_b64(&access_key);
    if derived != record.secret_hash {
        return Err(FatimaError::message("Invalid Fatima access key."));
    }
    let password_key = decrypt_bytes(&record.wrapped_key, &access_key)?;
    let data = super::crypto::decrypt_json::<super::types::StoredVaultData>(
        &store.file.data,
        &password_key,
    )?;
    Ok((data, record.environments.clone()))
}

pub(crate) fn create_access_key_record(
    name: &str,
    environments: &[String],
    password_key: &[u8],
) -> Result<GeneratedAccessKey> {
    let (id, secret, raw_key) = create_raw_access_key();
    let salt = random_b64(16);
    let access_key = derive_key(&secret, &salt)?;
    let secret_hash = encode_b64(&access_key);
    let wrapped_key = encrypt_bytes(password_key, &access_key)?;
    let record = AccessKeyRecord {
        id,
        name: name.to_string(),
        salt,
        secret_hash,
        wrapped_key,
        environments: environments.to_vec(),
    };
    Ok(GeneratedAccessKey {
        key: raw_key,
        record,
    })
}

pub(crate) fn assert_access_environments(
    all_environments: &[String],
    environments: &[String],
) -> Result<()> {
    for environment in environments {
        assert_environment(all_environments, environment)?;
    }
    Ok(())
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
