#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

if !(sam --version > /dev/null 2>&1); then
	echo "Sam Cli not installed" >&2
	exit 1
fi

if !(docker info > /dev/null 2>&1); then
	echo "Docker is not running. Docker is needed to start dynamodb container." >&2
	exit 1
fi

# check for certs and generate if possible
cd "${PROJECT_DIR}/certs"
if !([ -f 'chatvious-cert.pem' ] || [ -f 'chatvious-cert-key.pem' ]); then
	echo "certificate or key not detected"
	if ! mkcert --version; then
		echo "mkcert not installed, can't generate tls certificate and key" >&2
		exit 1
	fi

	mkcert -cert-file chatvious-cert.pem -key-file chatvious-cert-key.pem localhost sub.localhost main.localhost sub.main.localhost
fi

cd "${PROJECT_DIR}/ejs-static"
echo "Serving static resources"
# static command is also shutdown when "ctrl+c" is pressed
npm run static &

LOOP_AMOUNT=0
MAX_LOOP=10
until curl -fs https://sub.main.localhost:8040 >/dev/null; do
	if [ $LOOP_AMOUNT -ge $MAX_LOOP ]; then
		echo "Static Page Timed Out" >&2
		kill $!
	fi
	LOOP_AMOUNT=$(($LOOP_AMOUNT + 1))
	sleep 0.2
done

xdg-open https://sub.main.localhost:8040

cd "${PROJECT_DIR}/serverless-aws-sam"
./start-api.sh
