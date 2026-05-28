use fatima_core::vault::{FatimaVault, VaultOptions};
use fatima_core::{Fatima, ProviderConfig};
use serde_json::json;

#[test]
fn vault_password_and_access_key_flow() {
    let temp = tempfile::tempdir().unwrap();
    let options = VaultOptions {
        cwd: Some(temp.path().display().to_string()),
        store_path: None,
    };

    assert!(!FatimaVault::has_store(Some(options.clone())));
    let mut vault = FatimaVault::initialize("secret-password", Some(options.clone())).unwrap();
    assert!(FatimaVault::has_store(Some(options.clone())));

    vault
        .set_secret(
            "development",
            "DATABASE_URL",
            "https://database.example.com",
            None,
        )
        .unwrap();
    let database_url_id = vault.snapshot().unwrap().secrets[0].id.clone();
    vault
        .set_secret(
            "production",
            "DATABASE_URL",
            "https://prod.example.com",
            Some(&database_url_id),
        )
        .unwrap();
    let generated = vault
        .generate_access_key("app", vec!["development".to_string()])
        .unwrap();
    vault.save().unwrap();

    let snapshot = vault.snapshot().unwrap();
    assert_eq!(snapshot.secrets.len(), 1);
    assert_eq!(
        snapshot.secrets[0].values["development"],
        "https://database.example.com"
    );
    assert_eq!(
        snapshot.secrets[0].values["production"],
        "https://prod.example.com"
    );

    let unlocked =
        FatimaVault::unlock_with_password("secret-password", Some(options.clone())).unwrap();
    assert_eq!(
        unlocked.get_secrets(Some("development")).unwrap()["DATABASE_URL"],
        "https://database.example.com"
    );
    assert_eq!(
        unlocked.get_secrets(Some("production")).unwrap()["DATABASE_URL"],
        "https://prod.example.com"
    );

    let keyed = FatimaVault::authenticate_with_key(&generated.key, Some(options.clone())).unwrap();
    assert_eq!(keyed.list_environments().unwrap(), vec!["development"]);
    assert_eq!(
        keyed.get_secrets(Some("development")).unwrap()["DATABASE_URL"],
        "https://database.example.com"
    );
    assert!(keyed.get_secrets(Some("production")).is_err());
}

#[test]
fn fatima_vault_provider_loads_from_access_key() {
    let temp = tempfile::tempdir().unwrap();
    let options = VaultOptions {
        cwd: Some(temp.path().display().to_string()),
        store_path: None,
    };
    let mut vault = FatimaVault::initialize("secret-password", Some(options)).unwrap();
    vault
        .set_secret("development", "TOKEN", "abc123", None)
        .unwrap();
    let generated = vault
        .generate_access_key("app", vec!["development".to_string()])
        .unwrap();
    vault.save().unwrap();

    let mut provider = ProviderConfig::new("fatima-vault");
    provider
        .options
        .insert("key".to_string(), json!(generated.key));
    provider
        .options
        .insert("cwd".to_string(), json!(temp.path().display().to_string()));

    let fatima = Fatima::new().add_provider("development", provider);
    let loaded = fatima.load_environment(Some("development"), false).unwrap();
    assert_eq!(loaded.loaded_env["TOKEN"], "abc123");
}

#[test]
fn vault_rejects_duplicate_global_secret_keys() {
    let temp = tempfile::tempdir().unwrap();
    let options = VaultOptions {
        cwd: Some(temp.path().display().to_string()),
        store_path: None,
    };
    let mut vault = FatimaVault::initialize("secret-password", Some(options)).unwrap();
    vault
        .set_secret("development", "TOKEN", "abc123", None)
        .unwrap();

    let error = vault
        .set_secret("production", "TOKEN", "def456", None)
        .unwrap_err();

    assert!(error.to_string().contains("already exists"));
}
