#!/usr/bin/env bash

# This script is a helper script for npm test to start up a dynamodb container
# for them to use and run the correct test with the specified arguments

set -euo pipefail
BASH_SCRIPTS_DIR="$(dirname "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)")"
SRC_DIR=$(dirname "${BASH_SCRIPTS_DIR}")
DYNAMODB_CONTAINER_NAME="chatvious-dynamodb-3821"

# run dynamodb starting script in the background and save pid
"${BASH_SCRIPTS_DIR}/dynamodb-start.sh" "$DYNAMODB_CONTAINER_NAME"

source "${BASH_SCRIPTS_DIR}/utils/db-helpers.sh"
wait_for_dynamodb
create_db_table "chatvious-test"
echo "DynamoDB is ready."

cleanup() {
	echo "Stopping and removing container"
	docker stop "${DYNAMODB_CONTAINER_NAME}"
	docker rm "${DYNAMODB_CONTAINER_NAME}"
}
trap cleanup EXIT

# run all test if no arguments
if [ $# -eq 0 ]; then
	echo "running full test"
	NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand "${SRC_DIR}"
	exit 0
fi

inBand=""
if [ "$1" = "--runInBand" ]; then
	echo "${SRC_DIR}"
	path=${2:2}
	inBand="--runInBand"
else
	path=${1:2}
fi

cd ${SRC_DIR}
NODE_OPTIONS=--experimental-vm-modules npx jest $inBand "${SRC_DIR}/${path}"
