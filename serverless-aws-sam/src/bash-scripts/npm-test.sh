#!/bin/bash

# This script is a helper script for npm test to start up a dynamodb container
# for them to use and run the correct test with the specified arguments

set -e
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
SRC_DIR=$(dirname "${SCRIPT_DIR}")

if !(docker info > /dev/null 2>&1); then
    echo "Docker is not running. Docker is needed to start dynamodb container."
    exit 1
fi

# Check if image exists locally, pull if not
if ! docker image inspect amazon/dynamodb-local:latest >/dev/null 2>&1; then
    echo "DynamoDB image not found locally, pulling..."
    docker pull amazon/dynamodb-local:latest
fi

# run dynamodb starting script in the background and save pid
"${SCRIPT_DIR}/dynamodb-start.sh" &
DB_START_PID=$!

# trap exit signals to stop container on exit
stop_db() {
    kill "$DB_START_PID"
}
trap stop_db SIGINT SIGTERM SIGHUP EXIT

source "${SCRIPT_DIR}/db-helpers.sh"
wait_for_dynamodb
create_db_table "chatvious-test"
echo "DynamoDB is ready."

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
