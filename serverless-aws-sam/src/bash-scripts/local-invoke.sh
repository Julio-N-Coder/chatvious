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

star_mock_ssm() {
	"${SCRIPT_DIR}/mock-ssm.sh" &
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

# add a check to see if dynamodb is already runing on port 8000

"${SCRIPT_DIR}/dynamodb-start.sh" "$DYNAMODB_CONTAINER_NAME"
source "${SCRIPT_DIR}/db-helpers.sh"
wait_for_dynamodb
create_db_table "chatvious"
echo "DynamoDB is ready."

# Will add more for other functions
cd "$SERVERLESS_BASE_DIR"

if [ "$TARGET" = "SignUpSignIn" ]; then
	star_mock_ssm

	sam local invoke --add-host host.docker.internal:host-gateway \
		--event "events/SignUp.json" \
		--env-vars "env-vars/env.json" SignUpSignIn
fi
