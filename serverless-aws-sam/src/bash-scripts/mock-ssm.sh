#!/usr/bin/env bash

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
MOCK_SSM_SERVER_DIR="$(dirname "$SCRIPT_DIR")/aws-mock"

check_keys() {
	# keys are made from the ED25519 algorithm
	private_key="${MOCK_SSM_SERVER_DIR}/keys/private_key.pem"
	public_key="${MOCK_SSM_SERVER_DIR}/keys/public_key.pem"

	if ! [ -f "$private_key" ]; then
		echo "generating local private key"
		openssl genpkey -algorithm ED25519 -out "$private_key"
	fi

	if ! [ -f "$public_key" ]; then
		echo "generating local public key"
		openssl pkey -in "$private_key" -pubout -out "$public_key"
	fi
}

start_mock_ssm() {
	check_keys

	echo "Starting Mock SSM Parameter Store server..."

	if ! command -v python3 &>/dev/null; then
		echo "Error: python3 is required but not installed."
		exit 1
	fi

	echo "Mock SSM server will run on http://localhost:8009"

	exec python3 "${MOCK_SSM_SERVER_DIR}/mock_ssm_server.py"
}

start_mock_ssm
