mod api;
pub mod config;
pub mod env;
mod error;
pub mod generators;
pub mod models;
pub mod providers;
mod runtime;
pub mod vault;

pub use api::{handle_api_request, ApiRequest, ApiResponse};
pub use config::{FatimaConfig, ModelConfig, ProviderConfig};
pub use env::{format_secrets, SecretFormat};
pub use error::{FatimaError, Result};
pub use generators::{generate, GenerateOutput};
pub use runtime::{Fatima, LoadedEnvironment};
pub use vault::FatimaVault;
