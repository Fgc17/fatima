use std::fs;
use std::path::Path;

use crate::env::{format_secrets, parse_env, SecretFormat, Secrets};
use crate::{FatimaError, Result};

use super::access_key::list_secrets_with_access_key;
use super::domain::{assert_environment, to_environment_map};
use super::types::{FatimaVaultSession, SecretRecord};
use super::vault::FatimaVault;

impl FatimaVault {
    pub fn get_secrets(&self, environment: Option<&str>) -> Result<Secrets> {
        match self.require_session()? {
            FatimaVaultSession::Password(unlocked) => {
                let environment = environment.unwrap_or(&unlocked.config.default_environment);
                assert_environment(&unlocked.config, environment)?;
                Ok(to_environment_map(
                    unlocked.vault.get(environment).cloned().unwrap_or_default(),
                ))
            }
            FatimaVaultSession::Key { raw_key, .. } => {
                list_secrets_with_access_key(raw_key, environment, Some(&self.options))
            }
        }
    }

    pub fn secrets(&self, environment: &str, access_key: &str) -> Result<Secrets> {
        list_secrets_with_access_key(access_key, Some(environment), Some(&self.options))
    }

    pub fn format_secrets(
        &self,
        environment: Option<&str>,
        format: SecretFormat,
    ) -> Result<String> {
        format_secrets(&self.get_secrets(environment)?, format)
    }

    pub fn set_secret(
        &mut self,
        environment: &str,
        key: &str,
        value: &str,
        id: Option<&str>,
    ) -> Result<()> {
        let unlocked = self.require_unlocked_mut()?;
        assert_environment(&unlocked.config, environment)?;
        if key.trim().is_empty() {
            return Err(FatimaError::message("Secret key cannot be empty."));
        }
        let secrets = unlocked.vault.entry(environment.to_string()).or_default();
        if let Some(id) = id {
            if let Some(secret) = secrets.iter_mut().find(|secret| secret.id == id) {
                secret.key = key.to_string();
                secret.value = value.to_string();
                return Ok(());
            }
        }
        secrets.push(SecretRecord {
            id: uuid::Uuid::new_v4().to_string(),
            key: key.to_string(),
            value: value.to_string(),
        });
        Ok(())
    }

    pub fn delete_secret(&mut self, environment: &str, id: &str) -> Result<()> {
        let unlocked = self.require_unlocked_mut()?;
        assert_environment(&unlocked.config, environment)?;
        if let Some(secrets) = unlocked.vault.get_mut(environment) {
            secrets.retain(|secret| secret.id != id);
        }
        Ok(())
    }

    pub fn import_env(&mut self, environment: &str, file_path: impl AsRef<Path>) -> Result<usize> {
        let path = file_path.as_ref();
        let content = fs::read_to_string(path).map_err(|source| FatimaError::ReadFile {
            path: path.display().to_string(),
            source,
        })?;
        let parsed = parse_env(&content);
        for (key, value) in &parsed {
            self.upsert_secret(environment, key, value)?;
        }
        Ok(parsed.len())
    }

    pub(crate) fn upsert_secret(
        &mut self,
        environment: &str,
        key: &str,
        value: &str,
    ) -> Result<()> {
        let unlocked = self.require_unlocked_mut()?;
        assert_environment(&unlocked.config, environment)?;
        let secrets = unlocked.vault.entry(environment.to_string()).or_default();
        if let Some(secret) = secrets.iter_mut().find(|secret| secret.key == key) {
            secret.value = value.to_string();
        } else {
            secrets.push(SecretRecord {
                id: uuid::Uuid::new_v4().to_string(),
                key: key.to_string(),
                value: value.to_string(),
            });
        }
        Ok(())
    }
}
