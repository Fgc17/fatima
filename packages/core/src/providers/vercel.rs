use std::fs;
use std::process::{Command, Stdio};

use crate::env::{parse_env, Secrets};
use crate::providers::options::{option_env_string, option_string};
use crate::providers::{Provider, ProviderContext};
use crate::{FatimaError, Result};

pub struct VercelProvider;

impl Provider for VercelProvider {
    fn name(&self) -> &'static str {
        "vercel"
    }

    fn load(&self, context: ProviderContext<'_>) -> Result<Secrets> {
        let org_id = option_env_string(
            context.options,
            context.env,
            "vercel-org-id",
            "VERCEL_ORG_ID",
        );
        let project_id = option_env_string(
            context.options,
            context.env,
            "vercel-project-id",
            "VERCEL_PROJECT_ID",
        );
        let token = option_env_string(context.options, context.env, "vercel-token", "VERCEL_TOKEN");
        let environment = option_string(context.options, "environment")
            .or_else(|| context.env.get("VERCEL_ENVIRONMENT").cloned())
            .or_else(|| std::env::var("VERCEL_ENVIRONMENT").ok())
            .unwrap_or_else(|| "development".to_string());

        let has_vercel_project = context.cwd.join(".vercel").exists();
        if !has_vercel_project {
            require(&org_id, "VERCEL_ORG_ID")?;
            require(&project_id, "VERCEL_PROJECT_ID")?;
            require(&token, "VERCEL_TOKEN")?;
        }

        let filename = format!(".tmp.fatima.vercel.{}.env", std::process::id());
        let output_path = context.cwd.join(&filename);
        let mut command = Command::new("vercel");
        command
            .current_dir(context.cwd)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .arg("env")
            .arg("pull")
            .arg(&filename)
            .arg(format!("--environment={environment}"));
        if !has_vercel_project {
            if let Some(token) = &token {
                command.arg(format!("--token={token}"));
            }
        }
        command.envs(context.env);
        if let Some(value) = &org_id {
            command.env("VERCEL_ORG_ID", value);
        }
        if let Some(value) = &project_id {
            command.env("VERCEL_PROJECT_ID", value);
        }
        if let Some(value) = &token {
            command.env("VERCEL_TOKEN", value);
        }

        let status = command
            .status()
            .map_err(|error| FatimaError::message(format!("failed to run vercel: {error}")))?;
        if !status.success() {
            let _ = fs::remove_file(&output_path);
            return Err(FatimaError::message(
                "Failed to pull environment variables from Vercel.",
            ));
        }

        let content = fs::read_to_string(&output_path).map_err(|source| FatimaError::ReadFile {
            path: output_path.display().to_string(),
            source,
        })?;
        let _ = fs::remove_file(&output_path);
        Ok(parse_env(&content))
    }
}

fn require(value: &Option<String>, name: &str) -> Result<()> {
    if value.as_deref().unwrap_or_default().trim().is_empty() {
        return Err(FatimaError::message(format!(
            "Missing configuration: {name}"
        )));
    }
    Ok(())
}
