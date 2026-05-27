use crate::env::Secrets;
use crate::providers::{Provider, ProviderContext};
use crate::Result;

pub struct ProcessEnvProvider;

impl Provider for ProcessEnvProvider {
    fn name(&self) -> &'static str {
        "process-env"
    }

    fn load(&self, _context: ProviderContext<'_>) -> Result<Secrets> {
        Ok(std::env::vars().collect())
    }
}
