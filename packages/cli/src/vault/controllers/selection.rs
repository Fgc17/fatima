use crate::vault::models::BrowseView;
use crate::vault::state::VaultAppState;

pub fn move_selection(state: &mut VaultAppState, vertical: isize, horizontal: isize) {
    match state.view {
        BrowseView::Environment => {
            if vertical != 0 {
                let len = state.selected_secrets().len();
                state.selected_index = clamp_index(state.selected_index, vertical, len);
            }
            if horizontal != 0 {
                let environments = state.environment_list();
                let current = environments
                    .iter()
                    .position(|environment| environment == &state.selected_environment)
                    .unwrap_or(0);
                let next = clamp_index(current, horizontal, environments.len());
                if let Some(environment) = environments.get(next) {
                    state.selected_environment = environment.clone();
                    state.matrix_column = next;
                    state.selected_index = 0;
                }
            }
        }
        BrowseView::Matrix => {
            state.matrix_row = clamp_index(state.matrix_row, vertical, state.matrix_keys().len());
            state.matrix_column = clamp_index(
                state.matrix_column,
                horizontal,
                state.environment_list().len(),
            );
        }
    }
}

pub fn toggle_view(state: &mut VaultAppState) {
    state.view = if state.view == BrowseView::Environment {
        BrowseView::Matrix
    } else {
        BrowseView::Environment
    };
}

pub fn clamp_selection(state: &mut VaultAppState) {
    let envs = state.environment_list();
    if !envs.iter().any(|env| env == &state.selected_environment) {
        state.selected_environment = envs.first().cloned().unwrap_or_default();
    }
    state.selected_index = state
        .selected_index
        .min(state.selected_secrets().len().saturating_sub(1));
    state.matrix_row = state
        .matrix_row
        .min(state.matrix_keys().len().saturating_sub(1));
    state.matrix_column = state.matrix_column.min(envs.len().saturating_sub(1));
}

fn clamp_index(current: usize, delta: isize, len: usize) -> usize {
    if len == 0 {
        return 0;
    }
    current.saturating_add_signed(delta).min(len - 1)
}
