#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

if !(sam --version > /dev/null 2>&1); then
	echo "Sam Cli not installed" >&2
	exit 1
fi

if !(docker info > /dev/null 2>&1); then
	echo "Docker is not running. Docker is needed to start dynamodb container."
	exit 1
fi

cd "${PROJECT_DIR}/ejs-static"
echo "Serving static resources"
# static command is also shutdown when "ctrl+c" is pressed
npm run static &

cd "${PROJECT_DIR}/serverless-aws-sam"
./start-api.sh
