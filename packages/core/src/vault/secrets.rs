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
                let environment = environment.unwrap_or(&unlocked.data.default_environment);
                assert_environment(&unlocked.data.environments, environment)?;
                Ok(to_environment_map(&unlocked.data.secrets, environment))
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
        let environment = environment.trim();
        let key = key.trim();
        assert_environment(&unlocked.data.environments, environment)?;
        if key.is_empty() {
            return Err(FatimaError::message("Secret key cannot be empty."));
        }

        if let Some(id) = id {
            let key_owner = unlocked
                .data
                .secrets
                .iter()
                .find(|secret| secret.key == key)
                .map(|secret| secret.id.clone());
            if key_owner.as_deref().is_some_and(|owner| owner != id) {
                return Err(FatimaError::message(format!(
                    "Secret key `{key}` already exists."
                )));
            }
            let secret = unlocked
                .data
                .secrets
                .iter_mut()
                .find(|secret| secret.id == id)
                .ok_or_else(|| FatimaError::message("Secret not found."))?;
            secret.key = key.to_string();
            secret
                .values
                .insert(environment.to_string(), value.to_string());
            return Ok(());
        }

        if unlocked.data.secrets.iter().any(|secret| secret.key == key) {
            return Err(FatimaError::message(format!(
                "Secret key `{key}` already exists."
            )));
        }
        let mut values = std::collections::BTreeMap::new();
        values.insert(environment.to_string(), value.to_string());
        unlocked.data.secrets.push(SecretRecord {
            id: uuid::Uuid::new_v4().to_string(),
            key: key.to_string(),
            values,
        });
        Ok(())
    }

    pub fn delete_secret(&mut self, environment: &str, id: &str) -> Result<()> {
        let unlocked = self.require_unlocked_mut()?;
        let environment = environment.trim();
        assert_environment(&unlocked.data.environments, environment)?;
        if let Some(secret) = unlocked
            .data
            .secrets
            .iter_mut()
            .find(|secret| secret.id == id)
        {
            secret.values.remove(environment);
        }
        unlocked
            .data
            .secrets
            .retain(|secret| !secret.values.is_empty());
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
        let environment = environment.trim();
        let key = key.trim();
        assert_environment(&unlocked.data.environments, environment)?;
        if let Some(secret) = unlocked
            .data
            .secrets
            .iter_mut()
            .find(|secret| secret.key == key)
        {
            secret
                .values
                .insert(environment.to_string(), value.to_string());
        } else {
            let mut values = std::collections::BTreeMap::new();
            values.insert(environment.to_string(), value.to_string());
            unlocked.data.secrets.push(SecretRecord {
                id: uuid::Uuid::new_v4().to_string(),
                key: key.to_string(),
                values,
            });
        }
        Ok(())
    }
}
