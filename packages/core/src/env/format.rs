use super::Secrets;
use crate::{FatimaError, Result};

#[derive(Clone, Copy, Debug)]
pub enum SecretFormat {
    Env,
    Json,
    Shell,
}

impl SecretFormat {
    pub fn parse(value: &str) -> Result<Self> {
        match value {
            "env" => Ok(Self::Env),
            "json" => Ok(Self::Json),
            "shell" => Ok(Self::Shell),
            _ => Err(FatimaError::message(
                "invalid format, expected env, json, or shell",
            )),
        }
    }
}

pub fn format_secrets(secrets: &Secrets, format: SecretFormat) -> Result<String> {
    match format {
        SecretFormat::Env => Ok(secrets
            .iter()
            .map(|(key, value)| format!("{key}={value}"))
            .collect::<Vec<_>>()
            .join("\n")),
        SecretFormat::Json => serde_json::to_string_pretty(secrets)
            .map_err(|error| FatimaError::message(error.to_string())),
        SecretFormat::Shell => Ok(secrets
            .iter()
            .map(|(key, value)| format!("export {key}={}", shell_quote(value)))
            .collect::<Vec<_>>()
            .join("\n")),
    }
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}
