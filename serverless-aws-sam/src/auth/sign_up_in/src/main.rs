use auth_lib::tokens::{TokenSet, TokensClient, UserInfoForTokens};
use auth_lib::{
    PasswordManager, Response,
    models::{DynamoDBClient, DynamoDBClientError, UserItem},
};
use lambda_runtime::{Error, LambdaEvent, run, service_fn};
use serde_json::Value;
use sign_up_in::ValidateBodyEnum;
use std::collections::HashMap;

async fn function_handler(event: LambdaEvent<Value>) -> Result<Response, Error> {
    let request: auth_lib::Request = serde_json::from_value(event.payload)?;
    let origin = std::env::var("SUB_DOMAIN_URL")
        .unwrap_or_else(|_| "https://sub.main.localhost:8040".to_string());

    let mut headers = HashMap::new();
    headers.insert(
        String::from("Content-Type"),
        String::from("application/json"),
    );
    headers.insert("Access-Control-Allow-Origin".to_string(), origin);
    headers.insert(
        "Access-Control-Allow-Credentials".to_string(),
        "true".to_string(),
    );
    headers.insert(
        "Access-Control-Allow-Headers".to_string(),
        "Content-Type".to_string(),
    );
    headers.insert(
        "Access-Control-Allow-Methods".to_string(),
        "OPTIONS,POST,GET".to_string(),
    );

    // Handle cors request
    if request.http_method == "OPTIONS" {
        headers.insert("Access-Control-Max-Age".to_string(), "86400".to_string()); // 24 hours

        return Ok(Response {
            status_code: 200,
            headers: Some(headers),
            multi_value_headers: None,
            body: "".to_string(),
        });
    }

    // validate body
    let (body, headers) = match sign_up_in::validate_body(request, headers) {
        ValidateBodyEnum::Body(body_header_tuple) => body_header_tuple,
        ValidateBodyEnum::Response(validate_response) => return validate_response,
    };

    let db_client = DynamoDBClient::new().await;
    // Dynamodb returns an empty vector if user does not exist but is a successful request
    let user_vec = match db_client.find_by_name_scan(&body.username).await {
        Ok(user_vec) => user_vec,
        Err(_) => {
            println!("validing user info error");
            return auth_lib::return_error(headers, 500, "Error while validating Info");
        }
    };

    if body.sign_up_or_in == "signup" {
        if user_vec.len() > 0 {
            return auth_lib::return_error(headers, 403, "User Already Exists");
        }

        let new_user = match UserItem::build(&body.username, &body.password) {
            Ok(new_user) => new_user,
            Err(_) => {
                println!("Password Hashing Error");
                return auth_lib::return_error(headers, 500, "Server Error");
            }
        };
        let token_user_info = UserInfoForTokens {
            user_id: new_user.user_id.clone(),
            user_name: new_user.user_name.clone(),
        };

        let tokens_client = TokensClient::new().await;

        let token_set = match tokens_client.generate_token_set(&token_user_info).await {
            Ok(token_set) => token_set,
            Err(_) => {
                println!("Token Generation Error");
                return auth_lib::return_error(headers, 500, "Server Error");
            }
        };

        // check max user limit and store the new user
        let users_limit = 200;

        if let Err(db_client_error) = db_client.check_and_add_user(users_limit, &new_user).await {
            return match db_client_error {
                DynamoDBClientError::LimitExceeded(limit_error_message) => {
                    auth_lib::return_error(headers, 429, &limit_error_message)
                }
                DynamoDBClientError::DynamoDbError(_) => {
                    auth_lib::return_error(headers, 500, "Internal Server Error")
                }
            };
        }

        return_lambda_success(headers, token_set)
    } else {
        if user_vec.len() < 1 {
            return auth_lib::return_error(headers, 401, "Have not Signed Up");
        }

        let user = user_vec.into_iter().next().unwrap();

        // validate password. will return Result<true> if valid
        match PasswordManager::verify_password(&body.password, &user.hashed_password) {
            Ok(is_valid) => {
                if !is_valid {
                    return auth_lib::return_error(headers, 401, "Unauthorized");
                }
            }
            Err(_) => {
                println!("Password hashing error");
                return auth_lib::return_error(headers, 500, "Server Error");
            }
        }

        let token_user_info = UserInfoForTokens {
            user_id: user.user_id,
            user_name: user.user_name,
        };

        let tokens_client = TokensClient::new().await;

        let token_set = match tokens_client.generate_token_set(&token_user_info).await {
            Ok(token_set) => token_set,
            Err(_) => {
                println!("Token Generation Error");
                return auth_lib::return_error(headers, 500, "Server Error");
            }
        };

        return_lambda_success(headers, token_set)
    }
}

fn return_lambda_success(
    headers: HashMap<String, String>,
    token_set: TokenSet,
) -> Result<Response, Error> {
    let domain = std::env::var("DOMAIN").unwrap_or_else(|_| "main.localhost".to_string());
    let mut multi_value_headers = HashMap::new();

    let cookies = vec![
        auth_lib::cookie(
            "access_token",
            &token_set.access_token,
            &domain,
            token_set.expires_in,
        ),
        auth_lib::cookie(
            "refresh_token",
            &token_set.refresh_token,
            &domain,
            365 * 24 * 3600, // 1 year
        ),
    ];

    multi_value_headers.insert("Set-Cookie".to_string(), cookies);

    Ok(Response {
        status_code: 200,
        headers: Some(headers),
        multi_value_headers: Some(multi_value_headers),
        body: serde_json::to_string(&token_set)?,
    })
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
