use std::collections::BTreeMap;
use std::path::Path;

use serde_json::Value;

use crate::env::Secrets;
use crate::Result;

pub struct ProviderContext<'a> {
    pub cwd: &'a Path,
    pub environment: &'a str,
    pub env: &'a Secrets,
    pub options: &'a BTreeMap<String, Value>,
}

pub trait Provider {
    fn name(&self) -> &'static str;
    fn load(&self, context: ProviderContext<'_>) -> Result<Secrets>;
}
