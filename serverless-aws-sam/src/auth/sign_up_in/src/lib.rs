use std::collections::HashMap;

use lambda_runtime::Error;

use serde::{Deserialize, Serialize};
use serde_json::json;

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::Rng;

pub mod models;
mod validate_body;
pub use crate::validate_body::validate_body;
pub use crate::validate_body::ValidateBodyEnum;

#[derive(Debug, Deserialize)]
pub struct Request {
    pub path: String,
    #[serde(rename = "httpMethod")]
    pub http_method: String,
    pub headers: Option<HashMap<String, String>>,
    #[serde(rename = "queryStringParameters")]
    pub query_string_parameters: Option<HashMap<String, String>>,
    #[serde(rename = "pathParameters")]
    pub path_parameters: Option<HashMap<String, String>>,
    pub body: Option<String>,
    #[serde(rename = "isBase64Encoded")]
    pub is_base64_encoded: bool,
}

#[derive(Debug, Deserialize)]
pub struct RequestBody {
    pub username: Option<String>,
    pub password: Option<String>,
    // options are signup and signin
    pub sign_up_or_in: Option<String>,
}

#[derive(Deserialize)]
pub struct Body {
    pub username: String,
    pub password: String,
    pub sign_up_or_in: String,
}

#[derive(Serialize)]
pub struct Response {
    pub headers: Option<HashMap<String, String>>,
    #[serde(rename = "statusCode")]
    pub status_code: i32,
    pub body: String,
}

pub struct PasswordManager;

impl PasswordManager {
    /// Hash a password with a random salt using Argon2
    pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2.hash_password(password.as_bytes(), &salt)?;
        Ok(password_hash.to_string())
    }

    /// Verify a password against a stored hash
    pub fn verify_password(
        password: &str,
        hash: &str,
    ) -> Result<bool, argon2::password_hash::Error> {
        let parsed_hash = PasswordHash::new(hash)?;
        let argon2 = Argon2::default();

        match argon2.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(()) => Ok(true),
            Err(argon2::password_hash::Error::Password) => Ok(false),
            Err(e) => Err(e),
        }
    }
}

const COLORS: [&'static str; 7] = ["blue", "green", "orange", "yellow", "sky", "purple", "pink"];
pub fn get_random_color() -> &'static str {
    let mut rng = rand::thread_rng();
    COLORS[rng.gen_range(0..COLORS.len())]
}

pub fn return_error(
    headers: HashMap<String, String>,
    status_code: i32,
    message: &str,
) -> Result<Response, Error> {
    Ok(Response {
        headers: Some(headers),
        status_code,
        body: json!({
            "error": message
        })
        .to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_random_color_test() {
        let color = get_random_color();
        assert!(COLORS.contains(&color), "Did not get a color")
    }

    #[test]
    fn password_hashing_and_verification_test() {
        let password = "my_secure_password123";

        // Hash the password
        let hash = PasswordManager::hash_password(password).unwrap();
        println!("Generated hash: {}", hash);

        // Verify correct password
        let is_valid = PasswordManager::verify_password(password, &hash).unwrap();
        assert!(is_valid);

        // Verify incorrect password
        let is_invalid = PasswordManager::verify_password("wrong_password", &hash).unwrap();
        assert!(!is_invalid);

        println!("Password verification test passed!");
    }
}
