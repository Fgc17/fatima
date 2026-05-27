use crossterm::event::{KeyCode, KeyEvent};
use miette::Result;

use crate::vault::controllers::{close_modal, command_items, run_command, run_command_key};
use crate::vault::state::VaultAppState;

pub fn handle_key(state: &mut VaultAppState, event: KeyEvent) -> Result<()> {
    match event.code {
        KeyCode::Esc => close_modal(state),
        KeyCode::Up => {
            let len = command_items(state).len();
            state.command_cursor = if len == 0 {
                0
            } else {
                state.command_cursor.saturating_sub(1)
            };
        }
        KeyCode::Down => {
            let len = command_items(state).len();
            state.command_cursor = if len == 0 {
                0
            } else {
                (state.command_cursor + 1).min(len - 1)
            };
        }
        KeyCode::Enter => run_command(state, state.command_cursor)?,
        KeyCode::Char(value) => run_command_key(state, value)?,
        _ => {}
    }
    Ok(())
}
