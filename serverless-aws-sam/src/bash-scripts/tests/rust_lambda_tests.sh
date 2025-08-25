#/usr/bin/env bash
set -euo pipefail

BASH_SCRIPTS_DIR="$(dirname "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)")"
SERVERLESS_BASE_DIR="$(dirname "$(dirname "$BASH_SCRIPTS_DIR")")"
RUST_AUTH_DIR="${SERVERLESS_BASE_DIR}/src/auth"

GREEN='\033[1;32m'
RESET='\033[0m'

# unit tests
echo -e "${GREEN}Running Rust unit tests\n"

cd "${RUST_AUTH_DIR}/token_refresh"
cargo test

cd "${RUST_AUTH_DIR}/sign_up_in"
cargo test

cd "${RUST_AUTH_DIR}/auth_lib"
cargo test --features dynamodb

echo -e "${GREEN}Rust unit tests completed\n"

# tests with SAM
echo "Rust Lambda Tests with SAM"
echo -e "$RESET"

source "${BASH_SCRIPTS_DIR}/utils/mocks.sh"
trap cleanup EXIT

start_dynamodb
start_mock_ssm

source "${BASH_SCRIPTS_DIR}/utils/sam-utils.sh"

is_resonse_valid_json() {
	if ! echo "$response" | jq . >/dev/null 2>&1; then
		echo "❌ FAILED: Output was not valid JSON."
		echo "   Output: $response"
		exit 1
	fi
}

body_validation() {
	if [[ -z "$body" || "$body" == "null" ]]; then
		echo "ERROR: Response body is missing"
		return 1
	fi
}

check_status_code() {
	if [ ! "$actual_code" -eq "$expected_code" ]; then
		echo "❌ FAILED: Expected status code $expected_code, but got $actual_code."
		echo "   Response: $response"
		exit 1
	fi
}

get_access_token() {
	echo "$body" | jq -r '.access_token'
}

get_id_token() {
	echo "$body" | jq -r '.id_token'
}

get_refresh_token() {
	echo "$body" | jq -r '.refresh_token'
}

get_expires_in() {
	echo "$body" | jq -r '.expires_in'
}

check_access_token() {
	if [[ "$access_token" == "null" || -z "$access_token" ]]; then
		echo "ERROR: access_token is missing or empty"
		exit 1
	fi
}

check_id_token() {
	if [[ "$id_token" == "null" || -z "$id_token" ]]; then
		echo "ERROR: id_token is missing or empty"
		exit 1
	fi
}

check_refresh_token() {
	if [[ "$refresh_token" == "null" || -z "$refresh_token" ]]; then
		echo "ERROR: refresh_token is missing or empty"
		exit 1
	fi
}

check_expires_in() {
	if [[ "$expires_in" == "null" || -z "$expires_in" ]]; then
		echo "ERROR: expires_in is missing or empty"
		exit 1
	fi
}

SignUpSignIn_function() {
	sign_up_or_in="$1"
	body="{\"username\":\"test_user\", \"password\": \"1234\", \"sign_up_or_in\": \"${sign_up_or_in}\"}"

	echo -e "${GREEN}Running SignUpSignIn ${sign_up_or_in} Test"
	echo -e "$RESET"

	response="$(rest_api_event_custom_common "GET" "/auth/signinup" "$body" | local_invoke_stdin "SignUpSignIn" | tail -n 1)"
	is_resonse_valid_json

	actual_code=$(echo "$response" | jq '.statusCode')
	check_status_code

	body=$(echo "$response" | jq -r '.body')
	body_validation

	access_token=$(get_access_token)
	id_token=$(get_id_token)
	refresh_token=$(get_refresh_token)
	expires_in=$(get_expires_in)

	check_access_token
	check_id_token
	check_refresh_token
	check_expires_in
}

expected_code="200"

# SignUpSignIn Tests
SignUpSignIn_function "signup"
SignUpSignIn_function "signin"

# TokenRefresh Test
body="{\"refresh_token\":\"${refresh_token}\"}"

echo -e "${GREEN}Running TokenRefresh Test"
echo -e "$RESET"

response="$(rest_api_event_custom_common "GET" "/auth/token_refresh" "$body" | local_invoke_stdin "TokenRefresh" | tail -n 1)"
is_resonse_valid_json

actual_code=$(echo "$response" | jq '.statusCode')
check_status_code

body=$(echo "$response" | jq -r '.body')
body_validation

access_token=$(get_access_token)
id_token=$(get_id_token)
expires_in=$(get_expires_in)

check_access_token
check_id_token
check_expires_in

echo -e "${GREEN}Tests Passed"
echo -e "$RESET"
