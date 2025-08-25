#/usr/bin/env bash
set -euo pipefail

BASH_SCRIPTS_DIR="$(dirname "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)")"
SERVERLESS_BASE_DIR="$(dirname "$(dirname "$BASH_SCRIPTS_DIR")")"
RUST_AUTH_DIR="${SERVERLESS_BASE_DIR}/src/auth"

GREEN='\033[1;32m'
RESET='\033[0m'

# unit tests
echo -e "${GREEN}Running Rust unit tests\n"

cd "${RUST_AUTH_DIR}/token_refresh"
cargo test

cd "${RUST_AUTH_DIR}/sign_up_in"
cargo test

cd "${RUST_AUTH_DIR}/auth_lib"
cargo test --features dynamodb

echo -e "${GREEN}Rust unit test completed"
echo -e "$RESET"
