#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
VENV_DIR="$SCRIPT_DIR/../.venv"

# Create venv if missing
if [ ! -d "$VENV_DIR" ]; then
	echo "Creating Python venv in $VENV_DIR..." >&2
	python3 -m venv "$VENV_DIR" >/dev/null 2>&1
	"$VENV_DIR/bin/pip" install --upgrade pip >/dev/null 2>&1
	"$VENV_DIR/bin/pip" install PyJWT cryptography >/dev/null 2>&1
fi

# Run the python script inside venv
"$VENV_DIR/bin/python" "$SCRIPT_DIR/generate_jwt.py" "$@"
