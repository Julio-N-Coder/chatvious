use std::collections::HashMap;

use lambda_runtime::{run, service_fn, Error, LambdaEvent};

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize)]
struct Request {
    path: String,
    httpMethod: String,
    headers: Option<HashMap<String, String>>,
    queryStringParameters: Option<HashMap<String, String>>,
    pathParameters: Option<HashMap<String, String>>,
    body: Option<String>,
    isBase64Encoded: bool,
}

#[derive(Deserialize)]
struct Body {
    username: String,
    password: String,
}

#[derive(Serialize)]
struct Response {
    statusCode: i32,
    body: String,
}

fn get_random_color() -> &'static str {
    let colors = ["blue", "green", "orange", "yellow", "sky", "purple", "pink"];
    // pick random color from array and return that color
    "color"
}

async fn function_handler(event: LambdaEvent<Value>) -> Result<Response, Error> {
    let request: Request = serde_json::from_value(event.payload)?;
    println!("{:#?}", request);
    // json parse body
    // check whether request is for signin or signup

    // if a signup request
    // check whether user exists already in dynamodb via username, return error if they exists
    // check whether username is greater then 3 and less than 20
    // get random color from this array ["blue", "green", "orange", "yellow", "sky", "purple", "pink"]
    // hash and salt password
    // generate a new sub id
    // generate new tokens
    // store the user and their info in dynamodb
    // return tokens

    // if a signin request
    // check whether user exists in dynamodb via username, return error if they don't exists
    // fetch their info like sub id
    // generate new tokens
    // return tokens

    let resp = Response {
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
