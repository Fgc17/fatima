use crossterm::event::{KeyCode, KeyEvent};
use miette::Result;

use crate::vault::controllers::{move_selection, open_modal, toggle_view};
use crate::vault::models::Modal;
use crate::vault::state::VaultAppState;

pub fn handle_key(state: &mut VaultAppState, event: KeyEvent) -> Result<()> {
    match event.code {
        KeyCode::Char('q') => state.should_quit = true,
        KeyCode::Char('/') | KeyCode::Char('?') => {
            state.command_cursor = 0;
            open_modal(state, Modal::CommandPalette);
        }
        KeyCode::Char('r') => state.revealed = !state.revealed,
        KeyCode::Char('v') => toggle_view(state),
        KeyCode::Left | KeyCode::Char('[') => move_selection(state, 0, -1),
        KeyCode::Right | KeyCode::Char(']') => move_selection(state, 0, 1),
        KeyCode::Up => move_selection(state, -1, 0),
        KeyCode::Down => move_selection(state, 1, 0),
        KeyCode::Char('a') => open_modal(state, Modal::AddSecret),
        KeyCode::Char('e') => open_modal(state, Modal::EditSecret),
        KeyCode::Char('d') => open_modal(state, Modal::DeleteSecret),
        KeyCode::Char('i') => open_modal(state, Modal::ImportEnv),
        KeyCode::Char('o') => open_modal(state, Modal::OutputEnv),
        KeyCode::Char('k') => open_modal(state, Modal::AccessKey),
        KeyCode::Char('n') => open_modal(state, Modal::CreateEnvironment),
        KeyCode::Char('R') => open_modal(state, Modal::RenameEnvironment),
        KeyCode::Char('D') => open_modal(state, Modal::DeleteEnvironment),
        KeyCode::Char('p') => open_modal(state, Modal::ChangePassword),
        _ => {}
    }
    Ok(())
}
