use std::collections::HashMap;

use lambda_runtime::{run, service_fn, Error, LambdaEvent};

use serde_json::Value;

use sign_up_in::models::DynamoDBClient;
use sign_up_in::models::UserItem;
use sign_up_in::tokens;
use sign_up_in::tokens::TokenSet;
use sign_up_in::PasswordManager;
use sign_up_in::Response;
use sign_up_in::ValidateBodyEnum;

async fn function_handler(event: LambdaEvent<Value>) -> Result<Response, Error> {
    let request: sign_up_in::Request = serde_json::from_value(event.payload)?;

    let mut headers = HashMap::new();
    headers.insert(
        String::from("Content-Type"),
        String::from("application/json"),
    );

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
            return sign_up_in::return_error(headers, 500, "Error while validating Info");
        }
    };

    if body.sign_up_or_in == "signup" {
        if user_vec.len() > 0 {
            return sign_up_in::return_error(headers, 403, "User Already Exists");
        }

        let new_user = match UserItem::build(&body.username, &body.password) {
            Ok(new_user) => new_user,
            Err(_) => {
                println!("Password Hashing Error");
                return sign_up_in::return_error(headers, 500, "Server Error");
            }
        };

        let token_set = match tokens::generate_token_set(&new_user).await {
            Ok(token_set) => token_set,
            Err(_) => {
                println!("Token Generation Error");
                return sign_up_in::return_error(headers, 500, "Server Error");
            }
        };

        // store the new user
        if let Err(_) = db_client.store_new_user(&new_user).await {
            println!("Failed to Store user");
            return sign_up_in::return_error(headers, 500, "Server Error");
        }

        return_lambda_success(headers, token_set)
    } else {
        if user_vec.len() < 1 {
            return sign_up_in::return_error(headers, 401, "Have not Signed Up");
        }

        let user = user_vec.into_iter().next().unwrap();

        // validate password. will return Result<true> if valid
        match PasswordManager::verify_password(&body.password, &user.hashed_password) {
            Ok(is_valid) => {
                if !is_valid {
                    return sign_up_in::return_error(headers, 401, "Unauthorized");
                }
            }
            Err(_) => {
                println!("Password hashing error");
                return sign_up_in::return_error(headers, 500, "Server Error");
            }
        }

        let token_set = match tokens::generate_token_set(&user).await {
            Ok(token_set) => token_set,
            Err(_) => {
                println!("Token Generation Error");
                return sign_up_in::return_error(headers, 500, "Server Error");
            }
        };

        return_lambda_success(headers, token_set)
    }
}

fn return_lambda_success(
    headers: HashMap<String, String>,
    token_set: TokenSet,
) -> Result<Response, Error> {
    // I need to set other headers like cookies, etc.
    Ok(Response {
        headers: Some(headers),
        status_code: 200,
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
