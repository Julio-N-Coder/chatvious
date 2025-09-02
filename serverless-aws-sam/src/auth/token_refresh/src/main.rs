use auth_lib::Request;
use auth_lib::Response;
use auth_lib::{
    tokens,
    tokens::{TokenVerificationError, UserInfoForTokens},
};
use lambda_runtime::{Error, LambdaEvent, run, service_fn};
use serde_json::Value;
use std::collections::HashMap;

async fn function_handler(event: LambdaEvent<Value>) -> Result<Response, Error> {
    let payload = event.payload;
    let request: Request = serde_json::from_value(payload)?;

    let mut headers = HashMap::new();
    headers.insert(
        String::from("Content-Type"),
        String::from("application/json"),
    );
    headers.insert("Access-Control-Allow-Origin".to_string(), "*".to_string());
    headers.insert(
        "Access-Control-Allow-Headers".to_string(),
        "Content-Type".to_string(),
    );
    headers.insert(
        "Access-Control-Allow-Methods".to_string(),
        "OPTIONS,POST,GET".to_string(),
    );

    // check if Content-Type header is application/json. Can be lowercase
    if let Some(request_headers) = &request.headers {
        if let Some(content_type) = request_headers
            .get("Content-Type")
            .or_else(|| request_headers.get("content-type"))
        {
            if !content_type.eq_ignore_ascii_case("application/json") {
                return auth_lib::return_error(headers, 400, "Invalid Content-Type");
            }
        } else {
            return auth_lib::return_error(headers, 400, "Invalid Content-Type");
        }
    } else {
        return auth_lib::return_error(headers, 400, "Invalid Content-Type");
    }

    let body = match token_refresh::validate_body(&request) {
        Ok(body) => body,
        Err(_) => return auth_lib::return_error(headers, 401, "Unauthorized"),
    };

    let refresh_token_claims = match tokens::verify_refresh_token(&body.refresh_token).await {
        Ok(refresh_token_claims) => refresh_token_claims,
        Err(token_error) => match token_error {
            TokenVerificationError::SsmError(_) => {
                println!("SSM parameter retrieval error");
                return auth_lib::return_error(headers, 500, "Internal Server Error");
            }
            TokenVerificationError::PemParsingError(_) => {
                println!("PEM key parsing error");
                return auth_lib::return_error(headers, 500, "Internal Server Error");
            }
            _ => return auth_lib::return_error(headers, 401, "Unauthorized"),
        },
    };

    let token_user_info = UserInfoForTokens {
        user_id: refresh_token_claims.sub,
        user_name: refresh_token_claims.username,
    };

    let refreshed_token_set = match tokens::generate_refreshed_token_set(&token_user_info).await {
        Ok(token_set) => token_set,
        Err(_) => return auth_lib::return_error(headers, 500, "Internal Server Error"),
    };

    let json_body = match serde_json::to_string(&refreshed_token_set) {
        Ok(json_body) => json_body,
        Err(_) => return auth_lib::return_error(headers, 500, "Internal Server Error"),
    };

    let domain = std::env::var("DOMAIN").unwrap_or_else(|_| "localhost".to_string());
    let mut multi_value_headers = HashMap::new();

    let cookies = vec![
        auth_lib::cookie(
            "access_token",
            &refreshed_token_set.access_token,
            &domain,
            refreshed_token_set.expires_in,
        ),
        auth_lib::cookie(
            "id_token",
            &refreshed_token_set.id_token,
            &domain,
            refreshed_token_set.expires_in,
        ),
    ];
    multi_value_headers.insert("Set-Cookie".to_string(), cookies);

    let resp = Response {
        status_code: 200,
        headers: Some(headers),
        multi_value_headers: Some(multi_value_headers),
        body: json_body,
    };

    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        // disable printing the name of the module in every log line.
        .with_target(false)
        // disabling time is handy because CloudWatch will add the ingestion time.
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}
