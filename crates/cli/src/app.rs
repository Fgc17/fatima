use clap::Parser;
use miette::{miette, Result};

use crate::args::{Cli, Command};
use crate::commands;
use crate::normalize::normalize_args;
use crate::ui;

pub fn main() {
    if let Err(error) = run() {
        let message = error.to_string();
        if !message.trim().is_empty() {
            eprintln!("{}", ui::atoms::failure(message));
        }
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let cli = Cli::parse_from(normalize_args(std::env::args_os().collect()));

    match cli.command {
        Command::Run {
            environment,
            config,
            process_env,
            command,
        } => commands::run::run(environment, config, process_env, command),
        Command::Generate {
            environment,
            config,
            strict,
        } => commands::generate::run(environment, config, strict),
        Command::Api { request } => commands::api::run(request),
        Command::Secrets {
            environment,
            format,
            config,
        } => commands::secrets::run(environment, format, config),
        Command::Validate {
            environment,
            config,
        } => commands::validate::run(environment, config),
        Command::Vault { extra } => {
            if let Some(command) = extra.first() {
                return Err(miette!(
                    "unknown vault command `{command}`; vault ships with `fatima` now, use `fatima vault`"
                ));
            }
            commands::vault::run()
        }
    }
}
