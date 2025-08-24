if !(return 0 2>/dev/null); then
	echo "Can't run script directly"
	exit 1
fi

BASH_SCRIPTS_DIR="$(dirname "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)")"
SERVERLESS_BASE_DIR="$(dirname "$(dirname "$BASH_SCRIPTS_DIR")")"
DYNAMODB_CONTAINER_NAME="chatvious-dynamodb-1283"
mock_ssm_pid=""
is_dynamodb_started=""

start_mock_ssm() {
	"${SERVERLESS_BASE_DIR}/src/utils/aws-mock/mock_ssm_server.py" &
	mock_ssm_pid="$!"
}

start_dynamodb() {
	# add a check to see if dynamodb is already runing on port 8000

	"${BASH_SCRIPTS_DIR}/dynamodb-start.sh" "$DYNAMODB_CONTAINER_NAME"
	source "${BASH_SCRIPTS_DIR}/utils/db-helpers.sh"
	wait_for_dynamodb
	create_db_table "chatvious"
	echo "DynamoDB is ready."
	is_dynamodb_started="1"
}

cleanup() {
	echo "Running cleanup..."

	if [ -n "$mock_ssm_pid" ]; then
		kill "$mock_ssm_pid"
	fi

	if [ -n "$is_dynamodb_started" ]; then
		echo "Stopping and removing dynamodb container"
		docker stop "${DYNAMODB_CONTAINER_NAME}" 2>/dev/null
		docker rm "${DYNAMODB_CONTAINER_NAME}" 2>/dev/null
	fi
}
