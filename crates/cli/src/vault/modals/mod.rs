mod change_password;
mod environment;
mod import_env;
mod output_env;
mod secret;
mod shared;
mod user_key;

use ratatui::buffer::Buffer;
use ratatui::layout::Rect;

use crate::vault::models::Modal;
use crate::vault::state::VaultAppState;

pub fn render(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    match state.modal {
        Some(Modal::AddSecret) => secret::render_form(area, buffer, state, "Add secret", "save"),
        Some(Modal::EditSecret) => secret::render_form(area, buffer, state, "Edit secret", "save"),
        Some(Modal::DeleteSecret) => secret::render_delete(area, buffer, state),
        Some(Modal::ImportEnv) => import_env::render(area, buffer, state),
        Some(Modal::OutputEnv) => output_env::render(area, buffer, state),
        Some(Modal::UserKey) => user_key::render(area, buffer, state),
        Some(Modal::CreateEnvironment) => environment::render_name_form(
            area,
            buffer,
            state,
            "Create environment",
            "Environment name",
            "create",
        ),
        Some(Modal::RenameEnvironment) => environment::render_name_form(
            area,
            buffer,
            state,
            "Rename environment",
            "Environment name",
            "rename",
        ),
        Some(Modal::DeleteEnvironment) => environment::render_delete(area, buffer, state),
        Some(Modal::ChangePassword) => change_password::render(area, buffer, state),
        _ => {}
    }
}
