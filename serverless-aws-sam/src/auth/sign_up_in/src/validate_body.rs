use std::collections::HashMap;

use lambda_runtime::Error;

use crate::{Body, Request, RequestBody, Response};

pub enum ValidateBodyEnum {
    Body((Body, HashMap<String, String>)),
    Response(Result<Response, Error>),
}

pub fn validate_body(request: Request, headers: HashMap<String, String>) -> ValidateBodyEnum {
    fn validate_error(headers: HashMap<String, String>, message: &str) -> ValidateBodyEnum {
        ValidateBodyEnum::Response(crate::return_error(headers, message))
    }

    let request_body: RequestBody = match &request.body {
        Some(b) => match serde_json::from_str(b) {
            Ok(request_body) => request_body,
            Err(_) => return validate_error(headers, "Failed to parse request body"),
        },
        None => return validate_error(headers, "Missing request body"),
    };
    println!("{:#?}", request_body);

    let Some(sign_up_or_in) = request_body.sign_up_or_in else {
        return validate_error(headers, "Did not specify signin or signup");
    };
    let Some(username) = request_body.username else {
        return validate_error(headers, "Missing username");
    };
    if username.len() < 3 || username.len() > 20 {
        return validate_error(headers, "username is either to short or long");
    }
    let Some(password) = request_body.password else {
        return validate_error(headers, "Missing password");
    };
    if sign_up_or_in != "signin" && sign_up_or_in != "signup" {
        return validate_error(headers, "sign_up_or_in must be either 'signin' or 'signup'");
    }

    ValidateBodyEnum::Body((
        Body {
            sign_up_or_in,
            username,
            password,
        },
        headers,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_headers() -> HashMap<String, String> {
        let mut headers = HashMap::new();
        headers.insert("content-type".to_string(), "application/json".to_string());
        headers
    }

    fn create_request_with_body(body: Option<String>) -> Request {
        Request {
            path: "/test".to_string(),
            httpMethod: "POST".to_string(),
            headers: None,
            queryStringParameters: None,
            pathParameters: None,
            body,
            isBase64Encoded: false,
        }
    }

    #[test]
    fn validate_body_test_success_signin() {
        let headers = create_test_headers();
        let body_json =
            r#"{"username": "testuser", "password": "testpass", "sign_up_or_in": "signin"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers.clone());

        match result {
            ValidateBodyEnum::Body((body, returned_headers)) => {
                assert_eq!(body.username, "testuser");
                assert_eq!(body.password, "testpass");
                assert_eq!(body.sign_up_or_in, "signin");
                assert_eq!(returned_headers, headers);
            }
            ValidateBodyEnum::Response(_) => panic!("Expected successful validation"),
        }
    }

    #[test]
    fn validate_body_test_success_signup() {
        let headers = create_test_headers();
        let body_json =
            r#"{"username": "newuser", "password": "newpass", "sign_up_or_in": "signup"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers.clone());

        match result {
            ValidateBodyEnum::Body((body, returned_headers)) => {
                assert_eq!(body.username, "newuser");
                assert_eq!(body.password, "newpass");
                assert_eq!(body.sign_up_or_in, "signup");
                assert_eq!(returned_headers, headers);
            }
            ValidateBodyEnum::Response(_) => panic!("Expected successful validation"),
        }
    }

    #[test]
    fn validate_body_test_missing_body() {
        let headers = create_test_headers();
        let request = create_request_with_body(None);

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for missing body
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for missing body"),
        }
    }

    #[test]
    fn validate_body_test_invalid_json() {
        let headers = create_test_headers();
        let invalid_json = r#"{"username": "testuser", "password": "testpass", invalid json"#;
        let request = create_request_with_body(Some(invalid_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for invalid JSON
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for invalid JSON"),
        }
    }

    #[test]
    fn validate_body_test_missing_sign_up_or_in() {
        let headers = create_test_headers();
        let body_json = r#"{"username": "testuser", "password": "testpass"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for missing sign_up_or_in
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for missing sign_up_or_in"),
        }
    }

    #[test]
    fn validate_body_test_missing_username() {
        let headers = create_test_headers();
        let body_json = r#"{"password": "testpass", "sign_up_or_in": "signin"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for missing username
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for missing username"),
        }
    }

    #[test]
    fn validate_body_test_missing_password() {
        let headers = create_test_headers();
        let body_json = r#"{"username": "testuser", "sign_up_or_in": "signin"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for missing password
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for missing password"),
        }
    }

    #[test]
    fn validate_body_test_username_too_short() {
        let headers = create_test_headers();
        let body_json = r#"{"username": "ab", "password": "testpass", "sign_up_or_in": "signin"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for username too short
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for username too short"),
        }
    }

    #[test]
    fn validate_body_test_username_too_long() {
        let headers = create_test_headers();
        let long_username = "a".repeat(21); // 21 characters
        let body_json = format!(
            r#"{{"username": "{}", "password": "testpass", "sign_up_or_in": "signin"}}"#,
            long_username
        );
        let request = create_request_with_body(Some(body_json));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for username too long
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for username too long"),
        }
    }

    #[test]
    fn validate_body_test_username_boundary_valid_min() {
        let headers = create_test_headers();
        let body_json = r#"{"username": "abc", "password": "testpass", "sign_up_or_in": "signin"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Body((body, _)) => {
                assert_eq!(body.username, "abc");
                assert_eq!(body.username.len(), 3);
            }
            ValidateBodyEnum::Response(_) => {
                panic!("Expected success for minimum valid username length")
            }
        }
    }

    #[test]
    fn validate_body_test_username_boundary_valid_max() {
        let headers = create_test_headers();
        let max_username = "a".repeat(20); // 20 characters
        let body_json = format!(
            r#"{{"username": "{}", "password": "testpass", "sign_up_or_in": "signin"}}"#,
            max_username
        );
        let request = create_request_with_body(Some(body_json));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Body((body, _)) => {
                assert_eq!(body.username.len(), 20);
            }
            ValidateBodyEnum::Response(_) => {
                panic!("Expected success for maximum valid username length")
            }
        }
    }

    #[test]
    fn validate_body_test_invalid_sign_up_or_in() {
        let headers = create_test_headers();
        let body_json =
            r#"{"username": "testuser", "password": "testpass", "sign_up_or_in": "invalid"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for invalid sign_up_or_in
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for invalid sign_up_or_in value"),
        }
    }

    #[test]
    fn validate_body_test_null_values_in_json() {
        let headers = create_test_headers();
        let body_json = r#"{"username": null, "password": "testpass", "sign_up_or_in": "signin"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for null username
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for null username"),
        }
    }

    #[test]
    fn validate_body_test_extra_json_fields() {
        let headers = create_test_headers();
        let body_json = r#"{"username": "testuser", "password": "testpass", "sign_up_or_in": "signin", "extra_field": "should_be_ignored"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Body((body, _)) => {
                assert_eq!(body.username, "testuser");
                assert_eq!(body.password, "testpass");
                assert_eq!(body.sign_up_or_in, "signin");
            }
            ValidateBodyEnum::Response(_) => panic!("Expected success with extra fields in JSON"),
        }
    }

    #[test]
    fn validate_body_test_case_sensitive_sign_up_or_in() {
        let headers = create_test_headers();
        let body_json =
            r#"{"username": "testuser", "password": "testpass", "sign_up_or_in": "SignIn"}"#;
        let request = create_request_with_body(Some(body_json.to_string()));

        let result = validate_body(request, headers);

        match result {
            ValidateBodyEnum::Response(_) => {
                // Expected error response for case-sensitive validation
            }
            ValidateBodyEnum::Body(_) => panic!("Expected error for case-sensitive sign_up_or_in"),
        }
    }
}
