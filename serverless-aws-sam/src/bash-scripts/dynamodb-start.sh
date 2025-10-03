#!/usr/bin/env bash
set -e
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
SRC_DIR=$(dirname "${SCRIPT_DIR}")

if [ -z "$1" ]; then
	echo "Did not pass a container name"
	exit 1
fi

if !(docker info > /dev/null 2>&1); then
	echo "Docker is not running. Docker is needed to start dynamodb container."
	exit 1
fi

# Check if image exists locally, pull if not
if ! docker image inspect amazon/dynamodb-local:latest >/dev/null 2>&1; then
	echo "DynamoDB image not found locally, pulling..."
	docker pull amazon/dynamodb-local:latest
fi

DYNAMODB_CONTAINER_NAME="$1"

echo "Starting docker container"
docker run -d --name "${DYNAMODB_CONTAINER_NAME}" -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -inMemory -sharedDb
