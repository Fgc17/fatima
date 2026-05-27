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
}
