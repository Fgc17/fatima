use std::path::PathBuf;

use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[command(
    name = "fatima",
    version,
    about = "Local-first environment and vault CLI"
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    /// Run a command with Fatima-loaded environment variables.
    Run {
        #[arg(short, long)]
        environment: Option<String>,
        #[arg(short, long, default_value = "fatima.json")]
        config: PathBuf,
        #[arg(long, default_value_t = false)]
        process_env: bool,
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        command: Vec<String>,
    },
    /// Generate env access files from your configured environment.
    Generate {
        #[arg(short, long)]
        environment: Option<String>,
        #[arg(short, long, default_value = "fatima.json")]
        config: PathBuf,
        #[arg(long, default_value_t = false)]
        strict: bool,
    },
    /// Run the machine-readable JSON API over stdin/stdout.
    Api { request: Option<String> },
    /// Print secrets for an environment.
    Secrets {
        #[arg(short, long)]
        environment: Option<String>,
        #[arg(short, long, default_value = "dotenv")]
        format: String,
        #[arg(short, long, default_value = "fatima.json")]
        config: PathBuf,
    },
    /// Validate configured environment variables.
    Validate {
        #[arg(short, long)]
        environment: Option<String>,
        #[arg(short, long, default_value = "fatima.json")]
        config: PathBuf,
    },
    /// Launch Fatima Vault.
    Vault {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true, hide = true)]
        extra: Vec<String>,
    },
}
