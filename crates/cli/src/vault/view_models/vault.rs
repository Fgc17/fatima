use std::collections::BTreeMap;

use crate::vault::models::BrowseView;
use crate::vault::state::VaultAppState;

pub struct VaultViewModel {
    pub environment_list: Vec<String>,
    pub selected_environment: String,
    pub focused_environment: String,
    pub secret_counts: BTreeMap<String, usize>,
    pub selected_secret_count: usize,
    pub matrix_key_count: usize,
    pub view: BrowseView,
    pub revealed: bool,
    pub overlay_open: bool,
}

pub fn use_vault(state: &VaultAppState) -> VaultViewModel {
    let environment_list = state.environment_list();
    let vault = state.vault_map();
    let secret_counts = environment_list
        .iter()
        .map(|environment| {
            (
                environment.clone(),
                vault.get(environment).map(Vec::len).unwrap_or(0),
            )
        })
        .collect();
    VaultViewModel {
        selected_secret_count: state.selected_secrets().len(),
        matrix_key_count: state.matrix_keys().len(),
        focused_environment: state.focused_environment(),
        selected_environment: state.selected_environment.clone(),
        environment_list,
        secret_counts,
        view: state.view,
        revealed: state.revealed,
        overlay_open: state.modal.is_some(),
    }
}
