use miette::{miette, Result};

use crate::vault::models::{Modal, ModalFocus};
use crate::vault::runtime::clipboard;
use crate::vault::state::VaultAppState;

pub fn open_modal(state: &mut VaultAppState, modal: Modal) {
    state.error = None;
    state.message = None;
    state.reset_modal_fields();
    match modal {
        Modal::EditSecret => {
            if let Some(secret) = state.active_secret() {
                state.field_key.value = secret.key;
                state.field_key.cursor = state.field_key.value.len();
                state.field_value.value = secret.value;
                state.field_value.cursor = state.field_value.value.len();
                state.editing_secret_id = Some(secret.id);
            } else {
                state.error = Some("No secret selected.".to_string());
                return;
            }
        }
        Modal::DeleteSecret => {
            if state.active_secret().is_none() {
                state.error = Some("No secret selected.".to_string());
                return;
            }
        }
        Modal::ImportEnv => {
            state.field_path.value = ".env".to_string();
            state.field_path.cursor = state.field_path.value.len();
            state.modal_focus = ModalFocus::Path;
        }
        Modal::AccessKey => {
            state.modal_focus = ModalFocus::Name;
            state.access_environments = vec![state.focused_environment()];
        }
        Modal::CreateEnvironment => state.modal_focus = ModalFocus::Name,
        Modal::RenameEnvironment => {
            state.field_name.value = state.focused_environment();
            state.field_name.cursor = state.field_name.value.len();
            state.modal_focus = ModalFocus::Name;
        }
        Modal::ChangePassword => state.modal_focus = ModalFocus::Password,
        _ => {}
    }
    state.modal = Some(modal);
}

pub fn close_modal(state: &mut VaultAppState) {
    state.modal = None;
    state.reset_modal_fields();
}

pub fn copy_generated_access_key(state: &mut VaultAppState) -> Result<()> {
    let Some(key) = &state.generated_access_key else {
        return Ok(());
    };
    clipboard::copy_osc52(key).map_err(|error| miette!(error.to_string()))?;
    state.access_key_copied = true;
    state.message = Some("Copied access key.".to_string());
    Ok(())
}
