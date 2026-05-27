use crossterm::event::KeyEvent;
use miette::Result;

use crate::vault::input::handlers::{auth, browse, command_palette, modal};
use crate::vault::models::{Modal, Mode};
use crate::vault::runtime::VaultRuntime;
use crate::vault::state::VaultAppState;

pub fn handle_key(
    state: &mut VaultAppState,
    runtime: &VaultRuntime,
    event: KeyEvent,
) -> Result<()> {
    state.message = None;

    if let Some(active_modal) = state.modal {
        return match active_modal {
            Modal::CommandPalette => command_palette::handle_key(state, event),
            _ => modal::handle_key(state, runtime, event),
        };
    }

    match state.mode {
        Mode::Onboarding | Mode::Unlock => auth::handle_key(state, runtime, event),
        Mode::Vault => browse::handle_key(state, event),
        Mode::Loading => Ok(()),
    }
}
