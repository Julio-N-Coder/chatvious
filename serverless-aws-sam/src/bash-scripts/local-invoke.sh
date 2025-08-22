#/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
SERVERLESS_BASE_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
SAM_TEMPLATE="${SERVERLESS_BASE_DIR}/template.yaml"
DYNAMODB_CONTAINER_NAME="chatvious-dynamodb-1283"
mock_ssm_pid=""

if [ -z "$1" ]; then
	echo "Function Logical Id not specified" >&2
	exit 2
fi

if ! yq --version &>/dev/null; then
	echo "yq not installed" >&2
	exit 1
fi

TARGET="$1"
shift || true

# Collect function logical IDs (unquoted, one per line)
mapfile -t FUNCTION_IDS < <(
	yq -r '.Resources
         | with_entries(select(.value.Type == "AWS::Serverless::Function"))
         | keys[]' "$SAM_TEMPLATE" | sed -e 's/\r$//'
)

if ((${#FUNCTION_IDS[@]} == 0)); then
	echo "No AWS::Serverless::Function resources found in" >&2
	echo "$SAM_TEMPLATE" >&2
	exit 1
fi

# Exact whole-line match (no regex interpretation)
if !(printf '%s\n' "${FUNCTION_IDS[@]}" | grep -Fxq -- "$TARGET"); then
	echo "Error: '$TARGET' is not a function logical id in $SAM_TEMPLATE" >&2
	echo "Available function ids:" >&2
	printf '  - %s\n' "${FUNCTION_IDS[@]}" >&2
	exit 1
fi

start_mock_ssm() {
	"${SERVERLESS_BASE_DIR}/src/aws-mock/mock_ssm_server.py" &
	mock_ssm_pid="$!"
}

cleanup() {
	echo "Running cleanup..."

	if [ -n "$mock_ssm_pid" ]; then
		kill "$mock_ssm_pid"
	fi

	echo "Stopping and removing dynamodb container"
	docker stop "${DYNAMODB_CONTAINER_NAME}" 2>/dev/null
	docker rm "${DYNAMODB_CONTAINER_NAME}" 2>/dev/null
}
trap cleanup EXIT

rest_api_event_custom_common() {
	local http_method="$1"
	local path="$2"
	local body="$3"
	local base_event_file="${SERVERLESS_BASE_DIR}/events/restAPIEvent.json"

	if ! [ -f "$base_event_file" ]; then
		echo "Error: Base event file $base_event_file not found"
		return 1
	fi

	if [[ -z "$http_method" || -z "$path" ]]; then
		echo "Usage: rest_api_event_custom_common <http_method> <path> [body_json] | 'sam command'"
		echo "Example: rest_api_event_custom_common 'GET' '/signinup' '{\"username\":\"test\"}' | 'sam command'"
		return 1
	fi

	if [[ -z "$body" ]]; then
		body_json='""'
	else
		# Escape the body JSON for embedding in the event
		body_json=$(echo "$body" | jq -R .)
	fi

	jq --arg method "$http_method" \
		--arg path "$path" \
		--argjson body "$body_json" \
		'.httpMethod = $method | .path = $path | .body = $body' \
		"$base_event_file"
}

# add a check to see if dynamodb is already runing on port 8000

"${SCRIPT_DIR}/dynamodb-start.sh" "$DYNAMODB_CONTAINER_NAME"
source "${SCRIPT_DIR}/db-helpers.sh"
wait_for_dynamodb
create_db_table "chatvious"
echo "DynamoDB is ready."

# Will add more for other functions
cd "$SERVERLESS_BASE_DIR"

if [ "$TARGET" = "SignUpSignIn" ]; then
	start_mock_ssm
	body="{\"username\":\"test_user\", \"password\": \"1234\", \"sign_up_or_in\": \"signup\"}"

	rest_api_event_custom_common "GET" "/auth/signinup" "$body" |
		sam local invoke --add-host host.docker.internal:host-gateway \
			--event "-" \
			--env-vars "env-vars/env.json" SignUpSignIn
fi
