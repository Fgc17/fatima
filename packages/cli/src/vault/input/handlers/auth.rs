use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use miette::Result;

use crate::vault::controllers::submit_form;
use crate::vault::models::{FormFocus, Mode};
use crate::vault::runtime::VaultRuntime;
use crate::vault::state::{TextFieldState, VaultAppState};

pub fn handle_key(
    state: &mut VaultAppState,
    runtime: &VaultRuntime,
    event: KeyEvent,
) -> Result<()> {
    match event.code {
        KeyCode::Esc => state.should_quit = true,
        KeyCode::Tab if state.mode == Mode::Onboarding => next_focus(state),
        KeyCode::Up if state.mode == Mode::Onboarding => previous_focus(state),
        KeyCode::Down if state.mode == Mode::Onboarding => next_focus(state),
        KeyCode::Enter => submit_form(state, runtime)?,
        KeyCode::Backspace => active_field(state).backspace(),
        KeyCode::Delete => active_field(state).clear(),
        KeyCode::Left => {
            let field = active_field(state);
            field.cursor = field.cursor.saturating_sub(1);
        }
        KeyCode::Right => {
            let field = active_field(state);
            field.cursor = (field.cursor + 1).min(field.value.len());
        }
        KeyCode::Char(value) if !event.modifiers.contains(KeyModifiers::CONTROL) => {
            active_field(state).insert(&value.to_string());
        }
        _ => {}
    }
    Ok(())
}

fn active_field(state: &mut VaultAppState) -> &mut TextFieldState {
    match state.form_focus {
        FormFocus::Password => &mut state.password,
        FormFocus::ConfirmPassword => &mut state.confirm_password,
    }
}

fn next_focus(state: &mut VaultAppState) {
    state.form_focus = match state.form_focus {
        FormFocus::Password => FormFocus::ConfirmPassword,
        FormFocus::ConfirmPassword => FormFocus::Password,
    };
}

fn previous_focus(state: &mut VaultAppState) {
    state.form_focus = match state.form_focus {
        FormFocus::Password => FormFocus::ConfirmPassword,
        FormFocus::ConfirmPassword => FormFocus::Password,
    };
}
