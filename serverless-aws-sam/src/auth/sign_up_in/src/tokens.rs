use aws_config::meta::region::RegionProviderChain;
use aws_config::BehaviorVersion;
use aws_sdk_ssm::Client;
use std::env;

async fn create_ssm_client() -> Client {
    let mut config_loader = aws_config::defaults(BehaviorVersion::latest());

    // Check if we're running in local development mode
    if let Ok(endpoint) = env::var("SSM_ENDPOINT_URL") {
        println!("Using custom SSM endpoint: {}", endpoint);
        config_loader = config_loader.endpoint_url(endpoint);

        let credentials = aws_sdk_ssm::config::Credentials::new(
            "dummy-access-key",
            "dummy-secret-key",
            None,
            None,
            "local-development",
        );
        config_loader = config_loader.credentials_provider(credentials);
    }

    let region_provider = RegionProviderChain::default_provider().or_else("us-west-1");
    config_loader = config_loader.region(region_provider);

    let config = config_loader.load().await;
    Client::new(&config)
}

async fn get_parameter(
    client: &Client,
    name: &str,
    with_decryption: bool,
) -> Result<String, aws_sdk_ssm::Error> {
    let result = client
        .get_parameter()
        .name(name)
        .with_decryption(with_decryption)
        .send()
        .await?;

    Ok(result
        .parameter()
        .and_then(|p| p.value())
        .unwrap_or_default()
        .to_string())
}

async fn retrieve_private_key_string() -> Result<String, aws_sdk_ssm::Error> {
    let ssm_client = create_ssm_client().await;
    get_parameter(&ssm_client, "/chatvious/private_key", true).await
}

// generate tokens function
