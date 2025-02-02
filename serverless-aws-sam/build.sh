#!/bin/bash
set -e
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
LAMBDA_AUTH_DIR="${SCRIPT_DIR}/src/cognito/lambda-authorizer"

if !(docker info > /dev/null 2>&1); then
    echo "Docker is not running. Docker is needed to run this build script."
    exit 1
fi

if !(sam --version > /dev/null 2>&1); then
    echo "Sam Cli not installed. Sam is needed to run this build script."
    echo "Go to https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html to install it"
    exit 1
fi

# build lambda authorizer with quarkus
cd "$LAMBDA_AUTH_DIR"
./mvnw install -Dnative -DskipTests -Dquarkus.native.container-build=true

# build sam project
cd "$SCRIPT_DIR"
if ! [ -f "llrt-lambda-x64.zip" ]; then
  wget "https://github.com/awslabs/llrt/releases/download/v0.4.0-beta/llrt-lambda-x64.zip"
fi

sam build
