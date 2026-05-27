use crate::{FatimaError, Result};

use super::crypto::{encrypt_bytes, random_bytes};
use super::domain::{assert_environment, rename_key};
use super::types::KEY_LENGTH;
use super::vault::FatimaVault;

impl FatimaVault {
    pub fn create_environment(&mut self, environment: &str) -> Result<()> {
        let unlocked = self.require_unlocked_mut()?;
        let environment = environment.trim();
        if environment.is_empty() {
            return Err(FatimaError::message("Environment name cannot be empty."));
        }
        if unlocked
            .config
            .environments
            .iter()
            .any(|value| value == environment)
        {
            return Err(FatimaError::message(format!(
                "Fatima environment already exists: {environment}"
            )));
        }
        let key = random_bytes(KEY_LENGTH);
        unlocked.keys.environment_keys.insert(
            environment.to_string(),
            encrypt_bytes(&key, &unlocked.password_key)?,
        );
        unlocked
            .environment_keys
            .insert(environment.to_string(), key);
        unlocked.vault.insert(environment.to_string(), Vec::new());
        unlocked.config.environments.push(environment.to_string());
        unlocked.project.environments = unlocked.config.environments.clone();
        Ok(())
    }

    pub fn rename_environment(&mut self, current: &str, next: &str) -> Result<()> {
        let unlocked = self.require_unlocked_mut()?;
        let current = current.trim();
        let next = next.trim();
        assert_environment(&unlocked.config, current)?;
        if next.is_empty() {
            return Err(FatimaError::message("Environment name cannot be empty."));
        }
        if current == next {
            return Ok(());
        }
        if unlocked
            .config
            .environments
            .iter()
            .any(|value| value == next)
        {
            return Err(FatimaError::message(format!(
                "Fatima environment already exists: {next}"
            )));
        }
        rename_key(&mut unlocked.vault, current, next);
        rename_key(&mut unlocked.environment_keys, current, next);
        rename_key(&mut unlocked.keys.environment_keys, current, next);
        for record in &mut unlocked.keys.access_keys {
            rename_key(&mut record.wrapped_environment_keys, current, next);
        }
        for environment in &mut unlocked.config.environments {
            if environment == current {
                *environment = next.to_string();
            }
        }
        if unlocked.config.default_environment == current {
            unlocked.config.default_environment = next.to_string();
        }
        unlocked.project.environments = unlocked.config.environments.clone();
        unlocked.project.default_environment = unlocked.config.default_environment.clone();
        Ok(())
    }

    pub fn delete_environment(&mut self, environment: &str) -> Result<String> {
        let unlocked = self.require_unlocked_mut()?;
        let environment = environment.trim();
        assert_environment(&unlocked.config, environment)?;
        if unlocked.config.environments.len() <= 1 {
            return Err(FatimaError::message(
                "Fatima vault must keep at least one environment.",
            ));
        }
        unlocked.vault.remove(environment);
        unlocked.environment_keys.remove(environment);
        unlocked.keys.environment_keys.remove(environment);
        unlocked
            .config
            .environments
            .retain(|value| value != environment);
        for record in &mut unlocked.keys.access_keys {
            record.wrapped_environment_keys.remove(environment);
        }
        unlocked
            .keys
            .access_keys
            .retain(|record| !record.wrapped_environment_keys.is_empty());
        if unlocked.config.default_environment == environment {
            unlocked.config.default_environment = unlocked.config.environments[0].clone();
        }
        unlocked.project.environments = unlocked.config.environments.clone();
        unlocked.project.default_environment = unlocked.config.default_environment.clone();
        Ok(unlocked.config.default_environment.clone())
    }
}
