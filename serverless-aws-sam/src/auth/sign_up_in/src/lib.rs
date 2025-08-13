use std::collections::HashMap;

use lambda_runtime::Error;

use serde::{Deserialize, Serialize};
use serde_json::json;

use rand::Rng;

mod models;
mod validate_body;
pub use crate::validate_body::validate_body;
pub use crate::validate_body::ValidateBodyEnum;

#[derive(Debug, Deserialize)]
pub struct Request {
    pub path: String,
    pub httpMethod: String,
    pub headers: Option<HashMap<String, String>>,
    pub queryStringParameters: Option<HashMap<String, String>>,
    pub pathParameters: Option<HashMap<String, String>>,
    pub body: Option<String>,
    pub isBase64Encoded: bool,
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
    pub statusCode: i32,
    pub body: String,
}

const COLORS: [&'static str; 7] = ["blue", "green", "orange", "yellow", "sky", "purple", "pink"];
pub fn get_random_color() -> &'static str {
    let mut rng = rand::rng();
    COLORS[rng.random_range(0..COLORS.len())]
}

pub fn return_error(headers: HashMap<String, String>, message: &str) -> Result<Response, Error> {
    Ok(Response {
        headers: Some(headers),
        statusCode: 400,
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
}
