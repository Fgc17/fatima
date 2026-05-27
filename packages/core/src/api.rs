use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::vault::{FatimaVault, VaultOptions};
use crate::{generate, Fatima, FatimaConfig, FatimaError, Result};

#[derive(Debug, Deserialize, Serialize)]
pub struct ApiRequest {
    pub method: String,
    #[serde(default)]
    pub params: Value,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl ApiResponse {
    pub fn ok(data: impl Serialize) -> Self {
        Self {
            ok: true,
            data: Some(serde_json::to_value(data).unwrap_or(Value::Null)),
            error: None,
        }
    }

    pub fn error(error: impl ToString) -> Self {
        Self {
            ok: false,
            data: None,
            error: Some(error.to_string()),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeParams {
    #[serde(default)]
    environment: Option<String>,
    #[serde(default)]
    config: Option<Value>,
    #[serde(default)]
    config_path: Option<String>,
    #[serde(default)]
    process_env: bool,
    #[serde(default)]
    strict: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VaultParams {
    #[serde(default)]
    options: Option<VaultOptions>,
    #[serde(default)]
    password: Option<String>,
    #[serde(default)]
    key: Option<String>,
    #[serde(default)]
    environment: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    environments: Vec<String>,
    #[serde(default)]
    secret_key: Option<String>,
    #[serde(default)]
    value: Option<String>,
    #[serde(default)]
    id: Option<String>,
    #[serde(default)]
    file_path: Option<String>,
}

pub fn handle_api_request(request: ApiRequest) -> ApiResponse {
    match handle(request) {
        Ok(response) => response,
        Err(error) => ApiResponse::error(error),
    }
}

fn handle(request: ApiRequest) -> Result<ApiResponse> {
    match request.method.as_str() {
        "loadEnvironment" | "load_environment" => {
            let params = runtime_params(request.params)?;
            let fatima = Fatima::from_config(resolve_config(&params)?);
            Ok(ApiResponse::ok(fatima.load_environment(
                params.environment.as_deref(),
                params.process_env,
            )?))
        }
        "secrets" => {
            let params = runtime_params(request.params)?;
            let fatima = Fatima::from_config(resolve_config(&params)?);
            Ok(ApiResponse::ok(
                fatima
                    .load_environment(params.environment.as_deref(), params.process_env)?
                    .loaded_env,
            ))
        }
        "validate" => {
            let params = runtime_params(request.params)?;
            let fatima = Fatima::from_config(resolve_config(&params)?);
            let loaded =
                fatima.load_environment(params.environment.as_deref(), params.process_env)?;
            fatima.validate(loaded.environment)?;
            Ok(ApiResponse::ok(serde_json::json!({ "valid": true })))
        }
        "generate" => {
            let params = runtime_params(request.params)?;
            Ok(ApiResponse::ok(generate(
                resolve_config(&params)?,
                params.environment.as_deref(),
                params.strict,
            )?))
        }
        method if method.starts_with("vault.") => handle_vault(method, request.params),
        method => Ok(ApiResponse::error(format!("unknown api method: {method}"))),
    }
}

fn handle_vault(method: &str, value: Value) -> Result<ApiResponse> {
    let params: VaultParams =
        serde_json::from_value(value).map_err(|error| FatimaError::message(error.to_string()))?;
    match method {
        "vault.hasStore" => Ok(ApiResponse::ok(FatimaVault::has_store(params.options))),
        "vault.getSettings" => Ok(ApiResponse::ok(FatimaVault::get_settings(params.options)?)),
        "vault.initialize" => {
            let password = required(params.password, "password")?;
            FatimaVault::initialize(&password, params.options)?;
            Ok(ApiResponse::ok(serde_json::json!({ "initialized": true })))
        }
        "vault.listEnvironments" => Ok(ApiResponse::ok(
            authenticated_vault(&params)?.list_environments()?,
        )),
        "vault.secrets" => Ok(ApiResponse::ok(
            authenticated_vault(&params)?.get_secrets(params.environment.as_deref())?,
        )),
        "vault.generateAccessKey" => {
            let mut vault = password_vault(&params)?;
            let generated =
                vault.generate_access_key(&required(params.name, "name")?, params.environments)?;
            vault.save()?;
            Ok(ApiResponse::ok(generated))
        }
        "vault.setSecret" => {
            let mut vault = password_vault(&params)?;
            vault.set_secret(
                &required(params.environment, "environment")?,
                &required(params.secret_key, "secretKey")?,
                &required(params.value, "value")?,
                params.id.as_deref(),
            )?;
            vault.save()?;
            Ok(ApiResponse::ok(serde_json::json!({ "ok": true })))
        }
        "vault.deleteSecret" => {
            let mut vault = password_vault(&params)?;
            vault.delete_secret(
                &required(params.environment, "environment")?,
                &required(params.id, "id")?,
            )?;
            vault.save()?;
            Ok(ApiResponse::ok(serde_json::json!({ "ok": true })))
        }
        "vault.createEnvironment" => {
            let mut vault = password_vault(&params)?;
            vault.create_environment(&required(params.environment, "environment")?)?;
            vault.save()?;
            Ok(ApiResponse::ok(serde_json::json!({ "ok": true })))
        }
        "vault.renameEnvironment" => {
            let mut vault = password_vault(&params)?;
            vault.rename_environment(
                &required(params.environment, "environment")?,
                &required(params.name, "name")?,
            )?;
            vault.save()?;
            Ok(ApiResponse::ok(serde_json::json!({ "ok": true })))
        }
        "vault.deleteEnvironment" => {
            let mut vault = password_vault(&params)?;
            let default_environment =
                vault.delete_environment(&required(params.environment, "environment")?)?;
            vault.save()?;
            Ok(ApiResponse::ok(
                serde_json::json!({ "defaultEnvironment": default_environment }),
            ))
        }
        "vault.importEnv" => {
            let mut vault = password_vault(&params)?;
            let count = vault.import_env(
                &required(params.environment, "environment")?,
                required(params.file_path, "filePath")?,
            )?;
            vault.save()?;
            Ok(ApiResponse::ok(serde_json::json!({ "count": count })))
        }
        "vault.changePassword" => {
            let mut vault = password_vault(&params)?;
            vault.change_password(&required(params.value, "value")?)?;
            vault.save()?;
            Ok(ApiResponse::ok(serde_json::json!({ "ok": true })))
        }
        "vault.snapshot" => Ok(ApiResponse::ok(password_vault(&params)?.snapshot()?)),
        _ => Ok(ApiResponse::error(format!("unknown api method: {method}"))),
    }
}

fn runtime_params(value: Value) -> Result<RuntimeParams> {
    serde_json::from_value(value).map_err(|error| FatimaError::message(error.to_string()))
}

fn resolve_config(params: &RuntimeParams) -> Result<FatimaConfig> {
    if let Some(path) = &params.config_path {
        return FatimaConfig::load(path);
    }
    match &params.config {
        Some(Value::String(path)) => FatimaConfig::load(path),
        Some(value) => serde_json::from_value::<FatimaConfig>(value.clone())
            .map(FatimaConfig::normalized)
            .map_err(|error| FatimaError::message(error.to_string())),
        None => FatimaConfig::load_default(),
    }
}

fn authenticated_vault(params: &VaultParams) -> Result<FatimaVault> {
    if let Some(password) = &params.password {
        FatimaVault::unlock_with_password(password, params.options.clone())
    } else if let Some(key) = &params.key {
        FatimaVault::authenticate_with_key(key, params.options.clone())
    } else {
        Err(FatimaError::message(
            "vault api requires `password` or `key` authentication",
        ))
    }
}

fn password_vault(params: &VaultParams) -> Result<FatimaVault> {
    FatimaVault::unlock_with_password(
        &required(params.password.clone(), "password")?,
        params.options.clone(),
    )
}

fn required(value: Option<String>, name: &str) -> Result<String> {
    value
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| FatimaError::message(format!("vault api requires `{name}`")))
}
