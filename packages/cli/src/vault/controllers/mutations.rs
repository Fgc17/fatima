use miette::{miette, Result};

use crate::vault::controllers::modal::{close_modal, copy_generated_access_key};
use crate::vault::controllers::selection::clamp_selection;
use crate::vault::models::Modal;
use crate::vault::runtime::VaultRuntime;
use crate::vault::state::VaultAppState;

pub fn submit_modal(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    let Some(modal) = state.modal else {
        return Ok(());
    };
    match modal {
        Modal::AddSecret | Modal::EditSecret => {
            save_secret(state, runtime, modal == Modal::EditSecret)
        }
        Modal::DeleteSecret => delete_secret(state, runtime),
        Modal::ImportEnv => import_env(state, runtime),
        Modal::CreateEnvironment => create_environment(state, runtime),
        Modal::RenameEnvironment => rename_environment(state, runtime),
        Modal::DeleteEnvironment => delete_environment(state, runtime),
        Modal::AccessKey => generate_access_key(state, runtime),
        Modal::ChangePassword => change_password(state, runtime),
        Modal::CommandPalette => Ok(()),
    }
}

fn refresh_snapshot(state: &mut VaultAppState, snapshot: fatima_core::vault::FatimaVaultSnapshot) {
    state.project = snapshot.project.clone();
    state.session = Some(snapshot);
    clamp_selection(state);
}

fn with_vault<T>(
    state: &mut VaultAppState,
    f: impl FnOnce(&mut fatima_core::vault::FatimaVault, &mut VaultAppState) -> fatima_core::Result<T>,
) -> Result<Option<T>> {
    let Some(mut vault) = state.vault.take() else {
        state.error = Some("Vault is not unlocked.".to_string());
        return Ok(None);
    };
    let result = f(&mut vault, state);
    state.vault = Some(vault);
    result.map(Some).map_err(|error| miette!(error.to_string()))
}

fn save_secret(state: &mut VaultAppState, runtime: &VaultRuntime, edit: bool) -> Result<()> {
    let environment = state.focused_environment();
    let key = state.field_key.value.clone();
    let value = state.field_value.value.clone();
    let id = if edit {
        state.editing_secret_id.clone()
    } else {
        None
    };
    if let Some(snapshot) = with_vault(state, |vault, _| {
        runtime.set_secret(vault, &environment, &key, &value, id.as_deref())
    })? {
        refresh_snapshot(state, snapshot);
        state.selected_environment = environment;
        state.message = Some("Saved secret.".to_string());
        close_modal(state);
    }
    Ok(())
}

fn delete_secret(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    let Some(secret) = state.active_secret() else {
        state.error = Some("No secret selected.".into());
        return Ok(());
    };
    let environment = state.focused_environment();
    if let Some(snapshot) = with_vault(state, |vault, _| {
        runtime.delete_secret(vault, &environment, &secret.id)
    })? {
        refresh_snapshot(state, snapshot);
        state.selected_environment = environment;
        state.message = Some("Deleted secret.".to_string());
        close_modal(state);
    }
    Ok(())
}

fn import_env(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    let environment = state.focused_environment();
    let path = state.field_path.value.clone();
    if let Some((count, snapshot)) = with_vault(state, |vault, _| {
        runtime.import_env(vault, &environment, &path)
    })? {
        refresh_snapshot(state, snapshot);
        state.selected_environment = environment;
        state.message = Some(format!("Imported {count} secrets."));
        close_modal(state);
    }
    Ok(())
}

fn create_environment(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    let environment = state.field_name.value.clone();
    if let Some(snapshot) = with_vault(state, |vault, _| {
        runtime.create_environment(vault, &environment)
    })? {
        refresh_snapshot(state, snapshot);
        state.selected_environment = environment;
        state.message = Some("Created environment.".to_string());
        close_modal(state);
    }
    Ok(())
}

fn rename_environment(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    let current = state.focused_environment();
    let next = state.field_name.value.clone();
    if let Some(snapshot) = with_vault(state, |vault, _| {
        runtime.rename_environment(vault, &current, &next)
    })? {
        refresh_snapshot(state, snapshot);
        state.selected_environment = next;
        state.message = Some("Renamed environment.".to_string());
        close_modal(state);
    }
    Ok(())
}

fn delete_environment(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    let environment = state.focused_environment();
    if let Some((selected, snapshot)) = with_vault(state, |vault, _| {
        runtime.delete_environment(vault, &environment)
    })? {
        refresh_snapshot(state, snapshot);
        state.selected_environment = selected;
        state.message = Some("Deleted environment.".to_string());
        close_modal(state);
    }
    Ok(())
}

fn generate_access_key(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    if state.generated_access_key.is_some() {
        return copy_generated_access_key(state);
    }
    let name = state.field_name.value.clone();
    let environments = state.access_environments.clone();
    if let Some((generated, snapshot)) = with_vault(state, |vault, _| {
        runtime.generate_access_key(vault, &name, environments)
    })? {
        refresh_snapshot(state, snapshot);
        state.generated_access_key = Some(generated.key);
        state.access_key_copied = false;
        state.message = None;
    }
    Ok(())
}

fn change_password(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    if state.field_password.value != state.field_confirm_password.value {
        state.error = Some("Passwords do not match.".to_string());
        return Ok(());
    }
    let password = state.field_password.value.clone();
    if let Some(snapshot) = with_vault(state, |vault, _| runtime.change_password(vault, &password))?
    {
        refresh_snapshot(state, snapshot);
        state.message = Some("Password changed. Existing access keys were revoked.".to_string());
        close_modal(state);
    }
    Ok(())
}
