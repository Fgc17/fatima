use crate::Result;

use super::crypto::{derive_key, encrypt_bytes, random_b64};
use super::domain::assert_non_empty_password;
use super::types::PrimaryKeyRecord;
use super::vault::FatimaVault;

impl FatimaVault {
    pub fn change_password(&mut self, password: &str) -> Result<()> {
        assert_non_empty_password(password)?;
        let unlocked = self.require_unlocked_mut()?;
        let salt = random_b64(16);
        let password_key = derive_key(password, &salt)?;
        unlocked.password_key = password_key.clone();
        unlocked.keys.primary = PrimaryKeyRecord { salt };
        unlocked.keys.environment_keys = unlocked
            .environment_keys
            .iter()
            .map(|(environment, key)| Ok((environment.clone(), encrypt_bytes(key, &password_key)?)))
            .collect::<Result<_>>()?;
        unlocked.keys.access_keys.clear();
        Ok(())
    }
}
