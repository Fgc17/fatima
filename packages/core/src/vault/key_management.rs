use crate::{FatimaError, Result};

use super::access_key::{assert_access_environments, create_access_key_record};
use super::domain::dedupe;
use super::types::GeneratedAccessKey;
use super::vault::FatimaVault;

impl FatimaVault {
    pub fn generate_access_key(
        &mut self,
        name: &str,
        environments: Vec<String>,
    ) -> Result<GeneratedAccessKey> {
        let unlocked = self.require_unlocked_mut()?;
        if name.trim().is_empty() {
            return Err(FatimaError::message(
                "Fatima access key name cannot be empty.",
            ));
        }
        let environments = dedupe(environments);
        if environments.is_empty() {
            return Err(FatimaError::message(
                "Select at least one environment for the Fatima key.",
            ));
        }
        assert_access_environments(&unlocked.data.environments, &environments)?;
        let generated = create_access_key_record(name, &environments, &unlocked.password_key)?;
        unlocked.access_keys.push(generated.record.clone());
        Ok(generated)
    }
}
