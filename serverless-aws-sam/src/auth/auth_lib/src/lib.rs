use chrono::{Duration, Utc};
use lambda_runtime::Error;
use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;

#[cfg(feature = "dynamodb")]
pub mod models;
#[cfg(feature = "dynamodb")]
pub use crate::models::PasswordManager;
pub mod tokens;

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
    #[serde(rename = "multiValueHeaders")]
    pub multi_value_headers: Option<HashMap<String, Vec<String>>>,
    #[serde(rename = "statusCode")]
    pub status_code: i32,
    pub body: String,
}

/// Returns the specified type in the success case
///
/// Returns a Lambda Response in Response variant
pub enum LambdaReturnEnum<T> {
    Body(T),
    Response(Result<Response, Error>),
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
        multi_value_headers: None,
        status_code,
        body: json!({
            "error": message
        })
        .to_string(),
    })
}

pub fn cookie(name: &str, value: &str, domain: &str, max_age: i64) -> String {
    let expires = Utc::now() + Duration::seconds(max_age);

    // Only add "Secure" if not running locally
    let secure = if domain == "localhost" {
        ""
    } else {
        "Secure; "
    };

    format!(
        "{}={}; Domain={}; Path=/; Expires={}; Max-Age={}; {}{}SameSite=Lax",
        name,
        value,
        domain,
        expires.format("%a, %d %b %Y %H:%M:%S GMT"),
        max_age,
        "", // "HttpOnly; " is off for now
        secure,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_random_color_test() {
        let color = get_random_color();
        assert!(COLORS.contains(&color), "Did not get a color")
    }
}
