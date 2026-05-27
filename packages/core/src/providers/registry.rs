use std::path::Path;

use crate::env::Secrets;
use crate::{FatimaError, ProviderConfig, Result};

use super::types::{Provider, ProviderContext};
use super::{env, fatima, file, infisical, process_env, vercel};

pub fn load_provider(
    cwd: &Path,
    environment: &str,
    provider: &ProviderConfig,
    env: &Secrets,
) -> Result<Secrets> {
    let context = ProviderContext {
        cwd,
        environment,
        env,
        options: &provider.options,
    };

    match provider.provider.as_str() {
        "file" | "local" => file::FileProvider.load(context),
        "process-env" => process_env::ProcessEnvProvider.load(context),
        "env" => env::EnvProvider.load(context),
        "fatima" | "fatima-vault" => fatima::FatimaProvider.load(context),
        "infisical" => infisical::InfisicalProvider.load(context),
        "vercel" => vercel::VercelProvider.load(context),
        name => Err(FatimaError::message(format!("unknown provider: {name}"))),
    }
}
