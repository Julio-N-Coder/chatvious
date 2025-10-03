#!/usr/bin/env bash
set -euo pipefail

# NOTE: I have had problems with running "sam local start-api" with docker desktop
# May need to switch to just docker engine to use this script

SERVERLESS_BASE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

if !(sam --version > /dev/null 2>&1); then
	echo "Sam Cli not installed" >&2
	exit 1
fi

source "${SERVERLESS_BASE_DIR}/src/bash-scripts/utils/mocks.sh"

start_api_cleanup() {
	# mocks cleanup
	cleanup

	# remove leftover containers from "sam local start-api"
    if [[ -n "$(docker ps -aq)" ]]; then
        echo "removing leftover containers"
        docker stop $(docker ps -aq)
        docker rm $(docker ps -aq)
    fi
}

trap start_api_cleanup EXIT

start_dynamodb
start_mock_ssm

sam local start-api --add-host host.docker.internal:host-gateway --env-vars ./env-vars/env.json
