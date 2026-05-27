use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use miette::Result;

use crate::vault::controllers::{close_modal, copy_generated_access_key, submit_modal};
use crate::vault::models::{Modal, ModalFocus};
use crate::vault::runtime::VaultRuntime;
use crate::vault::state::{TextFieldState, VaultAppState};

pub fn handle_key(
    state: &mut VaultAppState,
    runtime: &VaultRuntime,
    event: KeyEvent,
) -> Result<()> {
    if state.modal == Some(Modal::AccessKey) && state.generated_access_key.is_some() {
        return handle_generated_access_key_key(state, event);
    }

    match event.code {
        KeyCode::Esc => close_modal(state),
        KeyCode::Enter => submit_modal_safely(state, runtime)?,
        KeyCode::Tab | KeyCode::Down => next_modal_focus(state),
        KeyCode::Up => previous_modal_focus(state),
        KeyCode::Char(' ')
            if state.modal == Some(Modal::AccessKey)
                && state.modal_focus == ModalFocus::EnvironmentList =>
        {
            toggle_access_environment(state)
        }
        KeyCode::Backspace => active_modal_field(state)
            .map(TextFieldState::backspace)
            .unwrap_or(()),
        KeyCode::Delete => active_modal_field(state)
            .map(TextFieldState::clear)
            .unwrap_or(()),
        KeyCode::Left => {
            if let Some(field) = active_modal_field(state) {
                field.cursor = field.cursor.saturating_sub(1);
            }
        }
        KeyCode::Right => {
            if let Some(field) = active_modal_field(state) {
                field.cursor = (field.cursor + 1).min(field.value.len());
            }
        }
        KeyCode::Char(value) if !event.modifiers.contains(KeyModifiers::CONTROL) => {
            if let Some(field) = active_modal_field(state) {
                field.insert(&value.to_string());
            }
        }
        _ => {}
    }
    Ok(())
}

fn handle_generated_access_key_key(state: &mut VaultAppState, event: KeyEvent) -> Result<()> {
    match event.code {
        KeyCode::Esc => close_modal(state),
        KeyCode::Enter | KeyCode::Char('c') | KeyCode::Char('C') => {
            if let Err(error) = copy_generated_access_key(state) {
                state.error = Some(error.to_string());
            }
        }
        _ => {}
    }
    Ok(())
}

fn submit_modal_safely(state: &mut VaultAppState, runtime: &VaultRuntime) -> Result<()> {
    if let Err(error) = submit_modal(state, runtime) {
        state.error = Some(error.to_string());
    }
    Ok(())
}

fn active_modal_field(state: &mut VaultAppState) -> Option<&mut TextFieldState> {
    match state.modal_focus {
        ModalFocus::Key => Some(&mut state.field_key),
        ModalFocus::Value => Some(&mut state.field_value),
        ModalFocus::Name => Some(&mut state.field_name),
        ModalFocus::Path => Some(&mut state.field_path),
        ModalFocus::Password => Some(&mut state.field_password),
        ModalFocus::ConfirmPassword => Some(&mut state.field_confirm_password),
        ModalFocus::EnvironmentList => None,
    }
}

fn next_modal_focus(state: &mut VaultAppState) {
    if state.modal == Some(Modal::AccessKey) && state.modal_focus == ModalFocus::EnvironmentList {
        state.access_environment_cursor = (state.access_environment_cursor + 1)
            .min(state.environment_list().len().saturating_sub(1));
        return;
    }

    state.modal_focus = match state.modal {
        Some(Modal::AddSecret | Modal::EditSecret) => match state.modal_focus {
            ModalFocus::Key => ModalFocus::Value,
            _ => ModalFocus::Key,
        },
        Some(Modal::ChangePassword) => match state.modal_focus {
            ModalFocus::Password => ModalFocus::ConfirmPassword,
            _ => ModalFocus::Password,
        },
        Some(Modal::AccessKey) => match state.modal_focus {
            ModalFocus::Name => ModalFocus::EnvironmentList,
            _ => ModalFocus::Name,
        },
        _ => state.modal_focus,
    };
}

fn previous_modal_focus(state: &mut VaultAppState) {
    if state.modal == Some(Modal::AccessKey) && state.modal_focus == ModalFocus::EnvironmentList {
        if state.access_environment_cursor > 0 {
            state.access_environment_cursor = state.access_environment_cursor.saturating_sub(1);
        } else {
            state.modal_focus = ModalFocus::Name;
        }
        return;
    }

    state.modal_focus = match state.modal {
        Some(Modal::AddSecret | Modal::EditSecret) => match state.modal_focus {
            ModalFocus::Value => ModalFocus::Key,
            _ => ModalFocus::Value,
        },
        Some(Modal::ChangePassword) => match state.modal_focus {
            ModalFocus::ConfirmPassword => ModalFocus::Password,
            _ => ModalFocus::ConfirmPassword,
        },
        Some(Modal::AccessKey) => match state.modal_focus {
            ModalFocus::EnvironmentList => ModalFocus::Name,
            _ => ModalFocus::EnvironmentList,
        },
        _ => state.modal_focus,
    };
}

fn toggle_access_environment(state: &mut VaultAppState) {
    let Some(environment) = state
        .environment_list()
        .get(state.access_environment_cursor)
        .cloned()
    else {
        return;
    };
    if let Some(index) = state
        .access_environments
        .iter()
        .position(|value| value == &environment)
    {
        state.access_environments.remove(index);
    } else {
        state.access_environments.push(environment);
    }
}
