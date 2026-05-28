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
    if state.modal == Some(Modal::OutputEnv) {
        return handle_output_env_key(state, runtime, event);
    }

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
        ModalFocus::FormatList => None,
    }
}

fn handle_output_env_key(
    state: &mut VaultAppState,
    runtime: &VaultRuntime,
    event: KeyEvent,
) -> Result<()> {
    match event.code {
        KeyCode::Esc => close_modal(state),
        KeyCode::Enter => submit_modal_safely(state, runtime)?,
        KeyCode::Tab => cycle_output_focus(state, 1),
        KeyCode::BackTab => cycle_output_focus(state, -1),
        KeyCode::Down => move_output_selection(state, 1),
        KeyCode::Up => move_output_selection(state, -1),
        KeyCode::Backspace if state.modal_focus == ModalFocus::Path => state.field_path.backspace(),
        KeyCode::Delete if state.modal_focus == ModalFocus::Path => state.field_path.clear(),
        KeyCode::Left if state.modal_focus == ModalFocus::Path => {
            state.field_path.cursor = state.field_path.cursor.saturating_sub(1);
        }
        KeyCode::Right if state.modal_focus == ModalFocus::Path => {
            state.field_path.cursor =
                (state.field_path.cursor + 1).min(state.field_path.value.len());
        }
        KeyCode::Char(value)
            if state.modal_focus == ModalFocus::Path
                && !event.modifiers.contains(KeyModifiers::CONTROL) =>
        {
            state.field_path.insert(&value.to_string());
        }
        _ => {}
    }
    Ok(())
}

fn cycle_output_focus(state: &mut VaultAppState, direction: isize) {
    let current = match state.modal_focus {
        ModalFocus::EnvironmentList => 0,
        ModalFocus::Path => 1,
        ModalFocus::FormatList => 2,
        _ => 0,
    };
    let next = (current + direction).rem_euclid(3);
    state.modal_focus = match next {
        0 => ModalFocus::EnvironmentList,
        1 => ModalFocus::Path,
        _ => ModalFocus::FormatList,
    };
}

fn move_output_selection(state: &mut VaultAppState, direction: isize) {
    match state.modal_focus {
        ModalFocus::EnvironmentList => {
            let max = state.environment_list().len().saturating_sub(1);
            state.output_environment_cursor =
                move_cursor(state.output_environment_cursor, max, direction);
        }
        ModalFocus::FormatList => {
            state.output_format_cursor = move_cursor(
                state.output_format_cursor,
                crate::vault::models::OutputFormat::ALL
                    .len()
                    .saturating_sub(1),
                direction,
            );
        }
        ModalFocus::Path => cycle_output_focus(state, direction),
        _ => {}
    }
}

fn move_cursor(current: usize, max: usize, direction: isize) -> usize {
    if direction < 0 {
        current.saturating_sub(1)
    } else {
        (current + 1).min(max)
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
