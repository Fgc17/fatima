use std::fs;
use std::path::PathBuf;

use serde::Serialize;

use super::render::render_files;
use crate::env::Secrets;
use crate::{Fatima, FatimaConfig, FatimaError, Result};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateOutput {
    pub output_path: String,
    pub environment: String,
    pub loaded_env: Secrets,
}

pub fn generate(
    config: FatimaConfig,
    environment: Option<&str>,
    strict: bool,
) -> Result<GenerateOutput> {
    let fatima = Fatima::from_config(config.clone());
    let loaded = fatima.load_environment(environment, false)?;

    if strict {
        fatima.validate(&loaded.environment)?;
    }

    let folder = PathBuf::from(&config.config_file.folder_path);
    let file = config
        .file
        .clone()
        .unwrap_or_else(|| default_file(&config.generator).to_string());
    let files = render_files(&config, &file, &loaded.loaded_env)?;
    let first = files.first().map(|(path, _)| path.clone()).unwrap_or(file);

    for (path, content) in files {
        let output = folder.join(path);
        if let Some(parent) = output.parent() {
            fs::create_dir_all(parent).map_err(|error| FatimaError::message(error.to_string()))?;
        }
        fs::write(&output, content).map_err(|source| FatimaError::WriteFile {
            path: output.display().to_string(),
            source,
        })?;
    }

    Ok(GenerateOutput {
        output_path: folder.join(first).display().to_string(),
        environment: loaded.environment,
        loaded_env: loaded.loaded_env,
    })
}

fn default_file(generator: &str) -> &'static str {
    match generator {
        "typescript" => "env.ts",
        "javascript" => "env.js",
        "python" => "env.py",
        _ => "env",
    }
}
