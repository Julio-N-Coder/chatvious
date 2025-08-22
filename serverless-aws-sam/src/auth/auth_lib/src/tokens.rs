use aws_config::BehaviorVersion;
use aws_config::meta::region::RegionProviderChain;
use aws_sdk_ssm::Client;
use chrono::{Duration, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use std::env;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct AccessTokenClaims {
    pub sub: String,       // Subject (user ID)
    pub iss: String,       // Issuer
    pub aud: String,       // Audience
    pub exp: i64,          // Expiration time
    pub iat: i64,          // Issued at
    pub token_use: String, // "access"
    pub scope: String,     // Scopes (space-separated)
    pub auth_time: i64,    // Authentication time
    pub username: String,  // Username
    pub client_id: String, // Client ID
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IdTokenClaims {
    pub sub: String,
    pub iss: String,
    pub aud: String, // Audience (client_id)
    pub exp: i64,
    pub iat: i64,
    pub token_use: String, // "id"
    pub auth_time: i64,
    pub email: Option<String>,
    pub email_verified: Option<bool>,
    pub username: Option<String>,
    pub given_name: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshTokenClaims {
    pub sub: String,
    pub iss: String,
    pub aud: String,
    pub exp: i64,
    pub iat: i64,
    pub token_use: String,
    pub auth_time: i64,
    pub client_id: String,
    pub username: String,
}

#[derive(Debug)]
pub struct UserInfoForTokens {
    pub user_id: String,
    pub user_name: String,
}

#[derive(Debug, Serialize)]
pub struct TokenSet {
    pub access_token: String,
    pub id_token: String,
    pub refresh_token: String,
    pub expires_in: i64, // Access token expiration in seconds
}

#[derive(Debug, Serialize)]
pub struct RefreshedTokenSet {
    pub access_token: String,
    pub id_token: String,
    pub expires_in: i64, // Access token expiration in seconds
}

#[derive(Debug)]
pub struct TokenConfig {
    pub issuer: String,
    pub audience: String,
    pub client_id: String,
    pub is_sign_up_in: bool,
    pub access_token_expires_in: Duration,  // Default: 1 hour
    pub id_token_expires_in: Duration,      // Default: 1 hour
    pub refresh_token_expires_in: Duration, // Default: 365 days
}

pub enum TokenSetEnum {
    TokenSet(TokenSet),
    RefreshedTokenSet(RefreshedTokenSet),
}

#[derive(Debug)]
pub enum TokenVerificationError {
    InvalidToken(jsonwebtoken::errors::Error),
    InvalidTokenUse(String),
    SsmError(aws_sdk_ssm::Error),
    PemParsingError(jsonwebtoken::errors::Error),
}

pub trait TokenUseClaims {
    fn get_token_use(&self) -> &str;
}

impl TokenUseClaims for RefreshTokenClaims {
    fn get_token_use(&self) -> &str {
        &self.token_use
    }
}

impl std::fmt::Display for TokenVerificationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TokenVerificationError::InvalidToken(e) => write!(f, "Invalid token: {}", e),
            TokenVerificationError::InvalidTokenUse(expected) => {
                write!(f, "Invalid token use, expected: {}", expected)
            }
            TokenVerificationError::SsmError(e) => {
                write!(f, "SSM parameter retrieval error: {}", e)
            }
            TokenVerificationError::PemParsingError(e) => write!(f, "PEM key parsing error: {}", e),
        }
    }
}

impl std::error::Error for TokenVerificationError {}

impl Default for TokenConfig {
    fn default() -> Self {
        let audience = "chatvious-app".to_string();

        Self {
            issuer: "chatvious".to_string(),
            client_id: audience.clone(),
            audience,
            is_sign_up_in: true,
            access_token_expires_in: Duration::hours(1),
            id_token_expires_in: Duration::hours(1),
            refresh_token_expires_in: Duration::days(365),
        }
    }
}

async fn create_ssm_client() -> Client {
    let mut config_loader = aws_config::defaults(BehaviorVersion::latest());

    // Check if we're running in local development mode
    if let Ok(endpoint) = env::var("SSM_ENDPOINT_URL") {
        if !endpoint.is_empty() {
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

async fn retrieve_key_string(key_name: &str) -> Result<String, aws_sdk_ssm::Error> {
    let ssm_client = create_ssm_client().await;
    get_parameter(&ssm_client, key_name, true).await
}

// for refresh_tokens function, it connects to the ssm client 2 seperate times
// because it retrives both the private and public key. Maybe try using only one connection
async fn retrieve_private_key() -> Result<EncodingKey, TokenVerificationError> {
    let pem_string = retrieve_key_string("/chatvious/private_key")
        .await
        .map_err(TokenVerificationError::SsmError)?;

    // Use jsonwebtoken's built-in PEM parsing for ED25519
    let encoding_key = EncodingKey::from_ed_pem(pem_string.as_bytes())
        .map_err(TokenVerificationError::PemParsingError)?;
    Ok(encoding_key)
}

async fn retrieve_public_key() -> Result<DecodingKey, TokenVerificationError> {
    let pem_string = retrieve_key_string("/chatvious/public_key")
        .await
        .map_err(TokenVerificationError::SsmError)?;

    let decoding_key = DecodingKey::from_ed_pem(pem_string.as_bytes())
        .map_err(TokenVerificationError::PemParsingError)?;
    Ok(decoding_key)
}

pub async fn verify_refresh_token(
    token: &str,
) -> Result<RefreshTokenClaims, TokenVerificationError> {
    verify_token::<RefreshTokenClaims>(token, "refresh").await
}

async fn verify_token<T>(token: &str, expected_token_use: &str) -> Result<T, TokenVerificationError>
where
    T: for<'de> Deserialize<'de> + TokenUseClaims,
{
    let decoding_key = retrieve_public_key().await?;

    let mut validation = Validation::new(Algorithm::EdDSA);
    validation.set_required_spec_claims(&["exp"]);
    // will add aud validation later. set it with validation.set_audience()
    validation.validate_aud = false;

    let token_data = decode::<T>(token, &decoding_key, &validation)
        .map_err(TokenVerificationError::InvalidToken)?;

    let claims = token_data.claims;

    // Verify token use
    if claims.get_token_use() != expected_token_use {
        return Err(TokenVerificationError::InvalidTokenUse(
            expected_token_use.to_string(),
        ));
    }

    Ok(claims)
}

async fn generate_token_set_base(
    user_info: &UserInfoForTokens,
    config: &TokenConfig,
    scopes: Option<&str>,
) -> Result<TokenSetEnum, Box<dyn std::error::Error + Send + Sync>> {
    let encoding_key = retrieve_private_key().await?;

    let mut header = Header::new(Algorithm::EdDSA);
    header.kid = Some(Uuid::new_v4().to_string()); // Key ID - might want to use a consistent one

    let now = Utc::now();
    let auth_time = now.timestamp();
    let iat = now.timestamp();

    // Generate Access Token
    let access_exp = (now + config.access_token_expires_in).timestamp();
    let access_claims = AccessTokenClaims {
        sub: user_info.user_id.clone(),
        iss: config.issuer.clone(),
        aud: config.audience.clone(),
        exp: access_exp,
        iat,
        token_use: "access".to_string(),
        scope: scopes.unwrap_or("openid profile email").to_string(),
        auth_time,
        username: user_info.user_name.clone(),
        client_id: config.client_id.clone(),
    };

    let access_token = encode(&header, &access_claims, &encoding_key)?;

    // Generate ID Token
    let id_exp = (now + config.id_token_expires_in).timestamp();
    let id_claims = IdTokenClaims {
        sub: user_info.user_id.clone(),
        iss: config.issuer.clone(),
        aud: config.client_id.clone(), // ID token audience is the client_id
        exp: id_exp,
        iat,
        token_use: "id".to_string(),
        auth_time,
        email: None,
        email_verified: None,
        username: Some(user_info.user_name.clone()),
        given_name: None,
        name: None,
    };

    let id_token = encode(&header, &id_claims, &encoding_key)?;

    if !config.is_sign_up_in {
        return Ok(TokenSetEnum::RefreshedTokenSet(RefreshedTokenSet {
            access_token,
            id_token,
            expires_in: config.access_token_expires_in.num_seconds(),
        }));
    }

    // Generate Refresh Token
    let refresh_exp = (now + config.refresh_token_expires_in).timestamp();
    let refresh_claims = RefreshTokenClaims {
        sub: user_info.user_id.clone(),
        iss: config.issuer.clone(),
        aud: config.audience.clone(),
        exp: refresh_exp,
        iat,
        token_use: "refresh".to_string(),
        auth_time,
        client_id: config.client_id.clone(),
        username: user_info.user_name.clone(),
    };

    let refresh_token = encode(&header, &refresh_claims, &encoding_key)?;

    Ok(TokenSetEnum::TokenSet(TokenSet {
        access_token,
        id_token,
        refresh_token,
        expires_in: config.access_token_expires_in.num_seconds(),
    }))
}

pub async fn generate_token_set(
    token_user_info: &UserInfoForTokens,
) -> Result<TokenSet, Box<dyn std::error::Error + Send + Sync>> {
    let config = TokenConfig::default();

    match generate_token_set_base(token_user_info, &config, None).await {
        Ok(token_set_enum) => match token_set_enum {
            TokenSetEnum::TokenSet(token_set) => Ok(token_set),
            TokenSetEnum::RefreshedTokenSet(_) => {
                Err(Box::from("Wrong TokenSetEnum variant returned"))
            }
        },
        Err(error) => Err(error),
    }
}

pub async fn generate_refreshed_token_set(
    token_user_info: &UserInfoForTokens,
) -> Result<RefreshedTokenSet, Box<dyn std::error::Error + Send + Sync>> {
    let mut config = TokenConfig::default();
    config.is_sign_up_in = false;

    match generate_token_set_base(token_user_info, &config, None).await {
        Ok(token_set_enum) => match token_set_enum {
            TokenSetEnum::TokenSet(_) => Err(Box::from("Wrong TokenSetEnum variant returned")),
            TokenSetEnum::RefreshedTokenSet(refreshed_token_set) => Ok(refreshed_token_set),
        },
        Err(error) => Err(error),
    }
}
