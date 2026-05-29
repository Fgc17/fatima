use miette::{miette, Result};

use crate::vault::models::{BrowseView, Modal, ModalFocus};
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
                state.field_value.value = if state.view == BrowseView::Matrix {
                    state.active_matrix_value().unwrap_or_default()
                } else {
                    secret
                        .values
                        .get(&state.selected_environment)
                        .cloned()
                        .unwrap_or_default()
                };
                state.field_value.cursor = state.field_value.value.len();
                state.editing_secret_id = Some(secret.id);
                state.modal_focus = ModalFocus::Value;
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
        Modal::OutputEnv => {
            state.field_path.value = ".env".to_string();
            state.field_path.cursor = state.field_path.value.len();
            let focused = state.focused_environment();
            state.output_environment_cursor = state
                .environment_list()
                .iter()
                .position(|environment| environment == &focused)
                .unwrap_or(0);
            state.output_format_cursor = 0;
            state.modal_focus = ModalFocus::EnvironmentList;
        }
        Modal::UserKey => {
            state.modal_focus = ModalFocus::Name;
            state.user_key_environments = vec![state.focused_environment()];
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

pub fn copy_generated_user_key(state: &mut VaultAppState) -> Result<()> {
    let Some(key) = &state.generated_user_key else {
        return Ok(());
    };
    clipboard::copy_osc52(key).map_err(|error| miette!(error.to_string()))?;
    state.user_key_copied = true;
    state.message = Some("Copied user key.".to_string());
    Ok(())
}
