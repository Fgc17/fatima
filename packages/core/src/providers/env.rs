use crate::env::Secrets;
use crate::providers::{Provider, ProviderContext};
use crate::Result;

pub struct EnvProvider;

impl Provider for EnvProvider {
    fn name(&self) -> &'static str {
        "env"
    }

    fn load(&self, context: ProviderContext<'_>) -> Result<Secrets> {
        Ok(context.env.clone())
    }
}
