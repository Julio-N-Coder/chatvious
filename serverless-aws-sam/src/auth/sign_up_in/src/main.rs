use std::collections::HashMap;

use lambda_runtime::{run, service_fn, Error, LambdaEvent};

use serde_json::Value;

use sign_up_in::models::DynamoDBClient;
use sign_up_in::models::UserItem;
use sign_up_in::PasswordManager;
use sign_up_in::ValidateBodyEnum;

async fn function_handler(event: LambdaEvent<Value>) -> Result<sign_up_in::Response, Error> {
    // if a signup request
    // store the user and their info in dynamodb
    // generate new tokens
    // return tokens

    // EQUAL
    // fetch user
    // generate new tokens
    // return tokens

    // if a signin request
    // generate new tokens
    // return tokens

    let request: sign_up_in::Request = serde_json::from_value(event.payload)?;
    println!("{:#?}", request);

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
        Err(_) => return sign_up_in::return_error(headers, 500, "Error while validating Info"),
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
        let sub_id = &new_user.user_id;
    } else {
        if user_vec.len() < 1 {
            return sign_up_in::return_error(headers, 401, "Have not Signed Up");
        }

        let user = user_vec.into_iter().next().unwrap();
    }

    let resp = sign_up_in::Response {
        headers: Some(headers),
        statusCode: 200,
        body: "Hello World!".to_string(),
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
