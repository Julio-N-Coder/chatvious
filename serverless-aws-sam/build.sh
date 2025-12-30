#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
LAMBDA_AUTH_DIR="${SCRIPT_DIR}/src/auth/lambda-authorizer"

# Default options
DO_DEFAULT=true
DO_AUTHORIZE=false
DO_ALL=false
FUNCTION_NAME=""

show_help() {
	cat <<EOF
Usage: ./build.sh [OPTIONS] [FUNCTION_NAME]

Builds AWS SAM project and optional components.

Options:
  --authorizer        Build only the lambda authorizer (Quarkus)
  --all               Build authorizer + everything with 'sam build'
  -h, --help          Show this help message

Examples:
  ./build.sh                  # default: build all with sam build
  ./build.sh --all             # build authorizer + all
  ./build.sh --authorizer      # build only authorizer
  ./build.sh TokenRefresh      # build only TokenRefresh function
  ./build.sh --authorizer TokenRefresh   # build authorizer + function
EOF
}

build_authorizer_quarkus() {
	echo "Building authorizer..."
	cd "$LAMBDA_AUTH_DIR"
	./mvnw install -Dnative -DskipTests -Dquarkus.native.container-build=true
	cd - >/dev/null
}

check_llrt() {
	cd "$SCRIPT_DIR"
	if ! [ -f "llrt-lambda-x64.zip" ]; then
		wget "https://github.com/awslabs/llrt/releases/download/v0.6.2-beta/llrt-lambda-x64.zip"
	fi
}

# parse arguments
for arg in "$@"; do
	DO_DEFAULT=false
	case "$arg" in
	--authorizer) DO_AUTHORIZE=true ;;
	--all) DO_ALL=true ;;
	-h | --help)
		show_help
		exit 0
		;;
	--*)
		echo "Unknown option: $arg" >&2
		exit 1
		;;
	*)
		if [[ -n "$FUNCTION_NAME" ]]; then
			echo "Error: only one function name can be specified." >&2
			exit 1
		fi
		FUNCTION_NAME="$arg"
		;;
	esac
done

# check for invalid combos
if $DO_ALL && [[ -n "$FUNCTION_NAME" ]]; then
	echo "Error: --all cannot be combined with a function name." >&2
	exit 1
fi

if !(docker info > /dev/null 2>&1); then
	echo "Docker is not running. Docker is needed to run this build script."
	exit 1
fi

if !(sam --version > /dev/null 2>&1); then
	echo "Sam Cli not installed. Sam is needed to run this build script."
	echo "Go to https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html to install it"
	exit 1
fi

# run builds
if $DO_DEFAULT; then
	check_llrt
	cd "$SCRIPT_DIR"
	echo "Building everything with sam..."
	sam build
else
	if $DO_ALL; then
		build_authorizer_quarkus

		echo "Building everything with sam..."
		cd "$SCRIPT_DIR"
		check_llrt
		sam build
	fi

	if $DO_AUTHORIZE; then
		build_authorizer_quarkus
	fi

	if [[ -n "$FUNCTION_NAME" ]]; then
		echo "Building single function: $FUNCTION_NAME..."
		cd "$SCRIPT_DIR"
		sam build "$FUNCTION_NAME"
	fi
fi
