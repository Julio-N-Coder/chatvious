#!/bin/bash
set -e
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
SRC_DIR=$(dirname "${SCRIPT_DIR}")

if !(docker info > /dev/null 2>&1); then
    echo "Docker is not running. Docker is needed to start dynamodb container."
    exit 1
fi

DYNAMODB_CONTAINER_NAME="chatvious-dynamodb-3821"

cleanup_container() {
    echo "Stopping and removing container"
    docker stop "${DYNAMODB_CONTAINER_NAME}"
    docker rm "${DYNAMODB_CONTAINER_NAME}"
    exit
}

trap cleanup_container SIGINT SIGTERM SIGHUP EXIT

echo "Starting docker container"
docker run --name "${DYNAMODB_CONTAINER_NAME}" -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -inMemory -sharedDb &
DOCKER_PID=$!

# Wait for the docker process to end, or a signal to arrive
wait "$DOCKER_PID"
