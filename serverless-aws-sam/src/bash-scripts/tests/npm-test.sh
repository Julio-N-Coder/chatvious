#!/usr/bin/env bash
set -euo pipefail

BASH_SCRIPTS_DIR="$(dirname "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)")"
SRC_DIR=$(dirname "${BASH_SCRIPTS_DIR}")
DYNAMODB_CONTAINER_NAME="chatvious-dynamodb-3821"

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
