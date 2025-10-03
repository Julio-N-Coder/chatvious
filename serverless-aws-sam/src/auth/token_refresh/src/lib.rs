use auth_lib::Request;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Body<T> {
    pub refresh_token: T,
}

pub fn validate_body(request: &Request) -> Result<Body<String>, String> {
    let request_body: Body<Option<String>> = match &request.body {
        Some(body_string) => match serde_json::from_str(body_string) {
            Ok(request_body) => request_body,
            Err(_) => return Err("Body Parse Error".to_string()),
        },
        None => return Err("No Body".to_string()),
    };

    let Some(refresh_token) = request_body.refresh_token else {
        return Err("No Refresh Token".to_string());
    };
    if refresh_token.is_empty() {
        return Err("No Refresh Token".to_string());
    }

    Ok(Body { refresh_token })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_request_with_body(body: Option<String>) -> Request {
        Request {
            path: "/test".to_string(),
            http_method: "POST".to_string(),
            headers: None,
            query_string_parameters: None,
            path_parameters: None,
            body,
            is_base64_encoded: false,
        }
    }

    #[test]
    fn validate_body_success_test() {
        let body_json = r#"{"refresh_token": "random_value"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));
        let result = validate_body(&request);

        match result {
            Ok(body) => assert_eq!(body.refresh_token, "random_value"),
            Err(_) => panic!("Expected successful validation"),
        }
    }

    #[test]
    fn validate_body_no_body_test() {
        let request = create_request_with_body(None);
        let result = validate_body(&request);

        match result {
            Err(_) => {
                // Expected error response for missing body
            }
            Ok(_) => panic!("Expected error for missing body"),
        }
    }

    #[test]
    fn validate_body_no_token_test() {
        let body_json = r#"{"random_field": "random_value"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));
        let result = validate_body(&request);

        match result {
            Err(_) => {
                // Expected error response for missing body
            }
            Ok(_) => panic!("Expected error for missing body"),
        }
    }
}
