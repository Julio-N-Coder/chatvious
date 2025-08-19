use std::collections::HashMap;

use lambda_runtime::{Error, LambdaEvent, run, service_fn};

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize)]
struct Request {
    path: String,
    #[serde(rename = "httpMethod")]
    http_method: String,
    headers: Option<HashMap<String, String>>,
    #[serde(rename = "queryStringParameters")]
    query_string_parameters: Option<HashMap<String, String>>,
    #[serde(rename = "pathParameters")]
    path_parameters: Option<HashMap<String, String>>,
    body: Option<String>,
    #[serde(rename = "isBase64Encoded")]
    is_base64_encoded: bool,
}

#[derive(Serialize)]
struct Response {
    #[serde(rename = "statusCode")]
    status_code: i32,
    headers: HashMap<String, String>,
    body: String,
}

async fn function_handler(event: LambdaEvent<Value>) -> Result<Response, Error> {
    let payload = event.payload;
    let request: Request = serde_json::from_value(payload)?;
    println!("{:#?}", request);

    // Prepare the response
    let mut headers = HashMap::new();
    headers.insert("Content-Type".to_string(), "text/html".to_string());

    let resp = Response {
        status_code: 200,
        headers,
        body: "Hello World!".to_string(),
    };

    // Return `Response` (it will be serialized to JSON automatically by the runtime)
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
