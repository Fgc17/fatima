use miette::Result;

use crate::vault::controllers::modal::open_modal;
use crate::vault::controllers::selection::toggle_view;
use crate::vault::models::{BrowseView, Command, Modal};
use crate::vault::state::VaultAppState;

#[derive(Clone, Debug)]
pub struct CommandItem {
    pub key: char,
    pub command: Command,
    pub title: String,
    pub description: String,
}

pub fn command_items(state: &VaultAppState) -> Vec<CommandItem> {
    let env = state.focused_environment();
    let active = state.active_secret();
    vec![
        CommandItem {
            key: 'a',
            command: Command::AddSecret,
            title: "Add secret".into(),
            description: format!("Create a secret in {env}"),
        },
        CommandItem {
            key: 'e',
            command: Command::EditSecret,
            title: "Edit selected secret".into(),
            description: active
                .as_ref()
                .map(|s| s.key.clone())
                .unwrap_or_else(|| "No secret selected".into()),
        },
        CommandItem {
            key: 'd',
            command: Command::DeleteSecret,
            title: "Delete selected secret".into(),
            description: active
                .as_ref()
                .map(|s| s.key.clone())
                .unwrap_or_else(|| "No secret selected".into()),
        },
        CommandItem {
            key: 'r',
            command: Command::ToggleReveal,
            title: if state.revealed {
                "Hide secret values"
            } else {
                "Reveal secret values"
            }
            .into(),
            description: "Toggle value visibility".into(),
        },
        CommandItem {
            key: 'v',
            command: Command::ToggleView,
            title: if state.view == BrowseView::Environment {
                "Switch to matrix view"
            } else {
                "Switch to environment view"
            }
            .into(),
            description: "Toggle browsing mode".into(),
        },
        CommandItem {
            key: 'i',
            command: Command::ImportEnv,
            title: "Import .env file".into(),
            description: format!("Into {env}"),
        },
        CommandItem {
            key: 'k',
            command: Command::GenerateAccessKey,
            title: "Generate access key".into(),
            description: "Create CI/runtime credentials".into(),
        },
        CommandItem {
            key: 'n',
            command: Command::CreateEnvironment,
            title: "Create environment".into(),
            description: "Add a new vault environment".into(),
        },
        CommandItem {
            key: 'R',
            command: Command::RenameEnvironment,
            title: "Rename environment".into(),
            description: env.clone(),
        },
        CommandItem {
            key: 'D',
            command: Command::DeleteEnvironment,
            title: "Delete environment".into(),
            description: env,
        },
        CommandItem {
            key: 'p',
            command: Command::ChangePassword,
            title: "Rotate password".into(),
            description: "Re-encrypt vault and revoke keys".into(),
        },
        CommandItem {
            key: 'q',
            command: Command::Quit,
            title: "Quit".into(),
            description: "Close Fatima".into(),
        },
    ]
}

pub fn run_command(state: &mut VaultAppState, index: usize) -> Result<()> {
    let items = command_items(state);
    let Some(item) = items.get(index) else {
        return Ok(());
    };
    run(state, item.command);
    Ok(())
}

pub fn run(state: &mut VaultAppState, command: Command) {
    match command {
        Command::AddSecret => open_modal(state, Modal::AddSecret),
        Command::EditSecret => open_modal(state, Modal::EditSecret),
        Command::DeleteSecret => open_modal(state, Modal::DeleteSecret),
        Command::ToggleReveal => {
            state.revealed = !state.revealed;
            state.modal = None;
        }
        Command::ToggleView => {
            toggle_view(state);
            state.modal = None;
        }
        Command::ImportEnv => open_modal(state, Modal::ImportEnv),
        Command::GenerateAccessKey => open_modal(state, Modal::AccessKey),
        Command::CreateEnvironment => open_modal(state, Modal::CreateEnvironment),
        Command::RenameEnvironment => open_modal(state, Modal::RenameEnvironment),
        Command::DeleteEnvironment => open_modal(state, Modal::DeleteEnvironment),
        Command::ChangePassword => open_modal(state, Modal::ChangePassword),
        Command::Quit => state.should_quit = true,
    }
}

pub fn run_command_key(state: &mut VaultAppState, key: char) -> Result<()> {
    if let Some(index) = command_items(state).iter().position(|item| item.key == key) {
        run_command(state, index)?;
    }
    Ok(())
}
