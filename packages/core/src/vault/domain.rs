use std::collections::BTreeMap;

use crate::env::Secrets;
use crate::{FatimaError, Result};

use super::types::{SecretRecord, StoredProjectConfig};

pub(crate) fn to_environment_map(secrets: Vec<SecretRecord>) -> Secrets {
    secrets
        .into_iter()
        .map(|secret| (secret.key, secret.value))
        .collect()
}

pub(crate) fn assert_environment(config: &StoredProjectConfig, environment: &str) -> Result<()> {
    if !config.environments.iter().any(|value| value == environment) {
        return Err(FatimaError::message(format!(
            "Unknown Fatima environment: {environment}"
        )));
    }
    Ok(())
}

pub(crate) fn assert_non_empty_password(password: &str) -> Result<()> {
    if password.trim().is_empty() {
        return Err(FatimaError::message(
            "Fatima secret manager password cannot be empty.",
        ));
    }
    Ok(())
}

pub(crate) fn dedupe(values: Vec<String>) -> Vec<String> {
    values.into_iter().fold(Vec::new(), |mut output, value| {
        if !output.contains(&value) {
            output.push(value);
        }
        output
    })
}

pub(crate) fn rename_key<T>(map: &mut BTreeMap<String, T>, current: &str, next: &str) {
    if let Some(value) = map.remove(current) {
        map.insert(next.to_string(), value);
    }
}
