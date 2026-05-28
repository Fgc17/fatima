#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Mode {
    Loading,
    Onboarding,
    Unlock,
    Vault,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum BrowseView {
    Environment,
    Matrix,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Modal {
    CommandPalette,
    AddSecret,
    EditSecret,
    DeleteSecret,
    ImportEnv,
    OutputEnv,
    AccessKey,
    CreateEnvironment,
    RenameEnvironment,
    DeleteEnvironment,
    ChangePassword,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Command {
    AddSecret,
    EditSecret,
    DeleteSecret,
    ToggleReveal,
    ToggleView,
    ImportEnv,
    OutputEnv,
    GenerateAccessKey,
    CreateEnvironment,
    RenameEnvironment,
    DeleteEnvironment,
    ChangePassword,
    Quit,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum FormFocus {
    Password,
    ConfirmPassword,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ModalFocus {
    Key,
    Value,
    Name,
    Path,
    Password,
    ConfirmPassword,
    EnvironmentList,
    FormatList,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum OutputFormat {
    Dotenv,
    Json,
    Yml,
    BashExport,
}

impl OutputFormat {
    pub const ALL: [Self; 4] = [Self::Dotenv, Self::Json, Self::Yml, Self::BashExport];

    pub fn label(self) -> &'static str {
        match self {
            Self::Dotenv => "dotenv",
            Self::Json => "json",
            Self::Yml => "yml",
            Self::BashExport => "bash export",
        }
    }
}
