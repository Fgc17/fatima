use serde::Deserialize;

use crate::env::Secrets;
use crate::providers::options::{option_env_string, option_string};
use crate::providers::{Provider, ProviderContext};
use crate::{FatimaError, Result};

pub struct InfisicalProvider;

impl Provider for InfisicalProvider {
    fn name(&self) -> &'static str {
        "infisical"
    }

    fn load(&self, context: ProviderContext<'_>) -> Result<Secrets> {
        let client_id = required(
            option_env_string(
                context.options,
                context.env,
                "client-id",
                "INFISICAL_CLIENT_ID",
            ),
            "INFISICAL_CLIENT_ID",
        )?;
        let client_secret = required(
            option_env_string(
                context.options,
                context.env,
                "client-secret",
                "INFISICAL_CLIENT_SECRET",
            ),
            "INFISICAL_CLIENT_SECRET",
        )?;
        let project_id = required(
            option_env_string(
                context.options,
                context.env,
                "project-id",
                "INFISICAL_PROJECT_ID",
            ),
            "INFISICAL_PROJECT_ID",
        )?;
        let site_url = option_env_string(
            context.options,
            context.env,
            "site-url",
            "INFISICAL_SITE_URL",
        )
        .unwrap_or_else(|| "https://app.infisical.com".to_string());

        let environment = option_string(context.options, "environment")
            .or_else(|| context.env.get("INFISICAL_ENVIRONMENT").cloned())
            .or_else(|| std::env::var("INFISICAL_ENVIRONMENT").ok())
            .unwrap_or_else(|| "dev".to_string());

        load_from_api(
            &site_url,
            &client_id,
            &client_secret,
            &project_id,
            &environment,
        )
    }
}

fn load_from_api(
    site_url: &str,
    client_id: &str,
    client_secret: &str,
    project_id: &str,
    environment: &str,
) -> Result<Secrets> {
    let client = reqwest::blocking::Client::new();
    let base = site_url.trim_end_matches('/');
    let auth: LoginResponse = client
        .post(format!("{base}/api/v1/auth/universal-auth/login"))
        .json(&serde_json::json!({ "clientId": client_id, "clientSecret": client_secret }))
        .send()
        .and_then(|response| response.error_for_status())
        .map_err(|error| {
            FatimaError::message(format!("failed to authenticate with Infisical: {error}"))
        })?
        .json()
        .map_err(|error| {
            FatimaError::message(format!("failed to parse Infisical auth response: {error}"))
        })?;

    let secrets: SecretsResponse = client
        .get(format!("{base}/api/v3/secrets/raw"))
        .bearer_auth(auth.access_token)
        .query(&[
            ("workspaceId", project_id),
            ("environment", environment),
            ("secretPath", "/"),
        ])
        .send()
        .and_then(|response| response.error_for_status())
        .map_err(|error| {
            FatimaError::message(format!("failed to load secrets from Infisical: {error}"))
        })?
        .json()
        .map_err(|error| {
            FatimaError::message(format!(
                "failed to parse Infisical secrets response: {error}"
            ))
        })?;

    Ok(secrets
        .secrets
        .into_iter()
        .map(|secret| (secret.secret_key, secret.secret_value))
        .collect())
}

fn required(value: Option<String>, name: &str) -> Result<String> {
    value.ok_or_else(|| FatimaError::message(format!("Missing configuration: {name}")))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoginResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct SecretsResponse {
    secrets: Vec<InfisicalSecret>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct InfisicalSecret {
    secret_key: String,
    secret_value: String,
}
