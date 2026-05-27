use crate::{FatimaError, Result};

use super::access_key::list_access_key_environments;
use super::store::{get_settings, has_store, initialize_store, read_store, unlock_store};
use super::types::{FatimaVaultSession, ProjectSecretManagerSettings, VaultOptions};

#[derive(Clone, Debug)]
pub struct FatimaVault {
    pub(crate) options: VaultOptions,
    pub(crate) session: Option<FatimaVaultSession>,
}

impl Default for FatimaVault {
    fn default() -> Self {
        Self::new()
    }
}

impl FatimaVault {
    pub fn new() -> Self {
        Self {
            options: VaultOptions::default(),
            session: None,
        }
    }

    pub fn with_options(options: VaultOptions) -> Self {
        Self {
            options,
            session: None,
        }
    }

    pub fn store_path(mut self, store_path: impl Into<String>) -> Self {
        self.options.store_path = Some(store_path.into());
        self
    }

    pub fn cwd(mut self, cwd: impl Into<String>) -> Self {
        self.options.cwd = Some(cwd.into());
        self
    }

    pub fn has_store(options: Option<VaultOptions>) -> bool {
        has_store(options.as_ref())
    }

    pub fn get_settings(options: Option<VaultOptions>) -> Result<ProjectSecretManagerSettings> {
        get_settings(options.as_ref())
    }

    pub fn initialize(password: &str, options: Option<VaultOptions>) -> Result<Self> {
        let options = options.unwrap_or_default();
        let unlocked = initialize_store(password, &options)?;
        Ok(Self {
            options,
            session: Some(FatimaVaultSession::Password(unlocked)),
        })
    }

    pub fn unlock_with_password(password: &str, options: Option<VaultOptions>) -> Result<Self> {
        let options = options.unwrap_or_default();
        let unlocked = unlock_store(password, Some(&options))?;
        Ok(Self {
            options,
            session: Some(FatimaVaultSession::Password(unlocked)),
        })
    }

    pub fn authenticate_with_key(key: &str, options: Option<VaultOptions>) -> Result<Self> {
        let options = options.unwrap_or_default();
        let environments = list_access_key_environments(key, Some(&options))?;
        Ok(Self {
            options,
            session: Some(FatimaVaultSession::Key {
                raw_key: key.to_string(),
                environments,
            }),
        })
    }

    pub fn resolve_default_access_key(provided_key: Option<&str>) -> Option<String> {
        provided_key
            .filter(|value| !value.trim().is_empty())
            .map(|value| value.trim().to_string())
            .or_else(|| std::env::var("FATIMA_ACCESS_KEY").ok())
            .filter(|value| !value.trim().is_empty())
    }

    pub fn resolve_default_password(provided_password: Option<&str>) -> Option<String> {
        provided_password
            .filter(|value| !value.trim().is_empty())
            .map(|value| value.trim().to_string())
            .or_else(|| std::env::var("FATIMA_VAULT_PASSWORD").ok())
            .filter(|value| !value.trim().is_empty())
    }

    pub fn is_authenticated(&self) -> bool {
        self.session.is_some()
    }

    pub fn list_environments(&self) -> Result<Vec<String>> {
        match self.require_session()? {
            FatimaVaultSession::Password(unlocked) => Ok(unlocked.config.environments.clone()),
            FatimaVaultSession::Key { environments, .. } => Ok(environments.clone()),
        }
    }

    pub fn get_default_environment(&self) -> Result<String> {
        match self.require_session()? {
            FatimaVaultSession::Password(unlocked) => {
                Ok(unlocked.config.default_environment.clone())
            }
            FatimaVaultSession::Key { .. } => {
                Ok(read_store(Some(&self.options))?.config.default_environment)
            }
        }
    }

    pub(crate) fn require_session(&self) -> Result<&FatimaVaultSession> {
        self.session
            .as_ref()
            .ok_or_else(|| FatimaError::message("Fatima vault is not authenticated."))
    }

    pub(crate) fn require_unlocked_mut(&mut self) -> Result<&mut super::types::UnlockedVault> {
        match self.session.as_mut() {
            Some(FatimaVaultSession::Password(unlocked)) => Ok(unlocked),
            Some(FatimaVaultSession::Key { .. }) => Err(FatimaError::message(
                "Fatima vault mutation requires password authentication.",
            )),
            None => Err(FatimaError::message("Fatima vault is not authenticated.")),
        }
    }
}
