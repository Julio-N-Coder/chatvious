#/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
SERVERLESS_BASE_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

if [ -z "$1" ]; then
	echo "Function Logical Id not specified" >&2
	exit 2
fi

if ! (yq --version && jq -V) &>/dev/null; then
	echo "yq or jq not installed" >&2
	exit 1
fi

TARGET="$1"
shift || true

source "${SCRIPT_DIR}/utils/sam-utils.sh"
verify_lambda_function_exists "$TARGET"

source "${SCRIPT_DIR}/utils/mocks.sh"
trap cleanup EXIT

# Will add more for other functions

if [ "$TARGET" = "SignUpSignIn" ]; then
	start_dynamodb
	start_mock_ssm
	body="{\"username\":\"test_user\", \"password\": \"1234\", \"sign_up_or_in\": \"signup\"}"

	rest_api_event_custom_common "GET" "/auth/signinup" "$body" | local_invoke_stdin "$TARGET"
fi

if [ "$TARGET" = "TokenRefresh" ]; then
	start_mock_ssm
	REFRESH_TOKEN=$("${SERVERLESS_BASE_DIR}/src/utils/jwt/generate_jwt.sh")
	body="{\"refresh_token\":\"${REFRESH_TOKEN}\"}"

	rest_api_event_custom_common "GET" "/auth/token_refresh" "$body" | local_invoke_stdin "$TARGET"
fi
