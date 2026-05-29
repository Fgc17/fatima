use miette::Result;

use crate::vault::models::{FormFocus, Mode};
use crate::vault::runtime::VaultRuntime;
use crate::vault::state::VaultAppState;

pub fn submit_form(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    match state.mode {
        Mode::Onboarding => submit_onboarding(state, runtime),
        Mode::Unlock => submit_unlock(state, runtime),
        _ => Ok(()),
    }
}

fn submit_onboarding(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    if state.form_focus == FormFocus::Password {
        state.form_focus = FormFocus::ConfirmPassword;
        return Ok(());
    }
    if state.password.value.trim().is_empty() {
        state.error = Some("Master password cannot be empty.".to_string());
        return Ok(());
    }
    if state.password.value != state.confirm_password.value {
        state.error = Some("Passwords do not match.".to_string());
        return Ok(());
    }
    let (vault, snapshot) = match runtime.initialize(&state.password.value) {
        Ok(value) => value,
        Err(error) => {
            state.error = Some(error.to_string());
            return Ok(());
        }
    };
    state.project = snapshot.project.clone();
    state.selected_environment = snapshot.config.default_environment.clone();
    state.vault = Some(vault);
    state.session = Some(snapshot);
    state.mode = Mode::Vault;
    state.error = None;
    state.message = Some("Created vault.".to_string());
    Ok(())
}

fn submit_unlock(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    if state.password.value.trim().is_empty() {
        state.error = Some("Master password cannot be empty.".to_string());
        return Ok(());
    }
    let (vault, snapshot) = match runtime.unlock(&state.password.value) {
        Ok(value) => value,
        Err(error) => {
            state.error = Some(error.to_string());
            return Ok(());
        }
    };
    state.project = snapshot.project.clone();
    state.selected_environment = snapshot.config.default_environment.clone();
    state.vault = Some(vault);
    state.session = Some(snapshot);
    state.mode = Mode::Vault;
    state.error = None;
    state.message = Some("Unlocked vault.".to_string());
    Ok(())
}
