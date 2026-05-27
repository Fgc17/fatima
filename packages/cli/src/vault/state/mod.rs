use std::collections::BTreeMap;

use fatima_core::vault::{
    FatimaVault, FatimaVaultSnapshot, ProjectSecretManagerSettings, SecretRecord,
};

mod text_field;

pub use crate::vault::models::{BrowseView, FormFocus, Modal, ModalFocus, Mode};
pub use text_field::TextFieldState;

pub struct VaultAppState {
    pub mode: Mode,
    pub modal: Option<Modal>,
    pub project: ProjectSecretManagerSettings,
    pub session: Option<FatimaVaultSnapshot>,
    pub vault: Option<FatimaVault>,
    pub message: Option<String>,
    pub error: Option<String>,
    pub revealed: bool,
    pub view: BrowseView,
    pub selected_environment: String,
    pub selected_index: usize,
    pub matrix_row: usize,
    pub matrix_column: usize,
    pub command_cursor: usize,
    pub modal_focus: ModalFocus,
    pub field_key: TextFieldState,
    pub field_value: TextFieldState,
    pub field_name: TextFieldState,
    pub field_path: TextFieldState,
    pub field_password: TextFieldState,
    pub field_confirm_password: TextFieldState,
    pub access_environment_cursor: usize,
    pub access_environments: Vec<String>,
    pub generated_access_key: Option<String>,
    pub access_key_copied: bool,
    pub editing_secret_id: Option<String>,
    pub password: TextFieldState,
    pub confirm_password: TextFieldState,
    pub form_focus: FormFocus,
    pub should_quit: bool,
}

impl VaultAppState {
    pub fn new(project: ProjectSecretManagerSettings) -> Self {
        Self {
            selected_environment: project.default_environment.clone(),
            mode: Mode::Loading,
            modal: None,
            project,
            session: None,
            vault: None,
            message: None,
            error: None,
            revealed: false,
            view: BrowseView::Environment,
            selected_index: 0,
            matrix_row: 0,
            matrix_column: 0,
            command_cursor: 0,
            modal_focus: ModalFocus::Key,
            field_key: TextFieldState::default(),
            field_value: TextFieldState::default(),
            field_name: TextFieldState::default(),
            field_path: TextFieldState::default(),
            field_password: TextFieldState::default(),
            field_confirm_password: TextFieldState::default(),
            access_environment_cursor: 0,
            access_environments: Vec::new(),
            generated_access_key: None,
            access_key_copied: false,
            editing_secret_id: None,
            password: TextFieldState::default(),
            confirm_password: TextFieldState::default(),
            form_focus: FormFocus::Password,
            should_quit: false,
        }
    }

    pub fn environment_list(&self) -> Vec<String> {
        self.session
            .as_ref()
            .map(|session| session.config.environments.clone())
            .unwrap_or_else(|| self.project.environments.clone())
    }

    pub fn vault_map(&self) -> BTreeMap<String, Vec<SecretRecord>> {
        self.session
            .as_ref()
            .map(|session| session.vault.clone())
            .unwrap_or_default()
    }

    pub fn selected_secrets(&self) -> Vec<SecretRecord> {
        let mut secrets = self
            .session
            .as_ref()
            .and_then(|session| session.vault.get(&self.selected_environment).cloned())
            .unwrap_or_default();
        secrets.sort_by(|left, right| left.key.cmp(&right.key));
        secrets
    }

    pub fn total_secret_count(&self) -> usize {
        self.session
            .as_ref()
            .map(|session| session.vault.values().map(Vec::len).sum())
            .unwrap_or(0)
    }

    pub fn matrix_keys(&self) -> Vec<String> {
        let mut keys = self
            .session
            .as_ref()
            .map(|session| {
                session
                    .vault
                    .values()
                    .flat_map(|secrets| secrets.iter().map(|secret| secret.key.clone()))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        keys.sort();
        keys.dedup();
        keys
    }

    pub fn focused_environment(&self) -> String {
        if self.view == BrowseView::Matrix {
            self.environment_list()
                .get(self.matrix_column)
                .cloned()
                .unwrap_or_else(|| self.selected_environment.clone())
        } else {
            self.selected_environment.clone()
        }
    }

    pub fn active_secret(&self) -> Option<SecretRecord> {
        let secrets = self.selected_secrets();
        secrets.get(self.selected_index).cloned()
    }

    pub fn reset_modal_fields(&mut self) {
        self.field_key.clear();
        self.field_value.clear();
        self.field_name.clear();
        self.field_path.clear();
        self.field_password.clear();
        self.field_confirm_password.clear();
        self.access_environment_cursor = 0;
        self.access_environments.clear();
        self.generated_access_key = None;
        self.access_key_copied = false;
        self.editing_secret_id = None;
        self.modal_focus = ModalFocus::Key;
    }
}
