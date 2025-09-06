#!/usr/bin/env bash
set -euo pipefail

BASH_SCRIPTS_DIR="$(dirname "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)")"
SERVERLESS_BASE_DIR="$(dirname "$(dirname "$BASH_SCRIPTS_DIR")")"

GREEN='\033[1;32m'
RED='\033[1;31m'
RESET='\033[0m'

source "${BASH_SCRIPTS_DIR}/utils/mocks.sh"
trap cleanup EXIT
start_mock_ssm

source "${BASH_SCRIPTS_DIR}/utils/test_utils.sh"
source "${BASH_SCRIPTS_DIR}/utils/sam-utils.sh"

echo -e "${GREEN}Running Lambda Authorizer Tests with SAM"
echo -e "$RESET"

check_context() {
	if [[ "$context" == "null" || -z "$context" ]]; then
		return 1
	fi
	return 0
}

check_access_token_is_null() {
	if [[ "$access_token" != "null" ]]; then
		echo -e "${RED}ERROR: access_token is not null" >&2
		echo -e "$RESET" >&2
		exit 1
	fi
}

check_effect_allow() {
	if [[ "$statement_effect" != "Allow" ]]; then
		echo -e "${RED}Policy Statement Effect is Deny" >&2
		echo -e "$RESET" >&2
		exit 1
	fi
}

check_effect_deny() {
	if [[ "$statement_effect" != "Deny" ]]; then
		echo -e "${RED}Policy Statement Effect is Allow" >&2
		echo -e "$RESET" >&2
		exit 1
	fi
}

success_run() {
	local refresh_only="$1"

	cd "$SERVERLESS_BASE_DIR"
	REFRESH_TOKEN=$(./src/utils/jwt/generate_jwt.sh)
	event_file="events/token_authorizer_event.json"

	if [[ -z "$refresh_only" ]]; then
		cookie_token_string="refresh_token=${REFRESH_TOKEN}"
	else
		cookie_token_string="refresh_token=${REFRESH_TOKEN}; access_token=${access_token}"
	fi

	response="$(jq --arg cookie_string "$cookie_token_string" \
		'.authorizationToken = $cookie_string' \
		"$event_file" | local_invoke_stdin LambdaAuthorizer | tail -n 1)"

	context="$(echo "$response" | jq -c '.context')"
	if ! check_context; then
		echo -e "${RED}ERROR: Context is missing or null" >&2
		echo -e "$RESET" >&2
		exit 1
	fi

	access_token=$(echo "$context" | jq -r '.access_token')
	policy_document=$(echo "$response" | jq -c '.policyDocument')
	statement="$(echo "$policy_document" | jq -c '.Statement[0]')"
	statement_effect="$(echo $statement | jq -r '.Effect')"
}

echo -e "${GREEN}Refresh Token Only Test"
echo -e "$RESET"

success_run ""

check_access_token
check_effect_allow

echo -e "${GREEN}All Tokens Test"
echo -e "$RESET"

success_run "all_tokens"

check_access_token_is_null
check_effect_allow

echo -e "${GREEN}Random Cookie String Test"
echo -e "$RESET"

cd "$SERVERLESS_BASE_DIR"
REFRESH_TOKEN=$(./src/utils/jwt/generate_jwt.sh)
event_file="events/token_authorizer_event.json"
cookie_token_string="refresh_token=fake_token_value.random.fake; random=random_value"

response="$(jq --arg cookie_string "$cookie_token_string" \
	'.authorizationToken = $cookie_string' \
	"$event_file" | local_invoke_stdin LambdaAuthorizer | tail -n 1)"

if [[ "$(echo "$response" | jq -r '.principalId')" != "Unauthorized" ]]; then
	echo -e "${RED}ERROR: principalId is not Unauthorized" >&2
	echo -e "$RESET" >&2
	exit 1
fi

context="$(echo "$response" | jq -c '.context')"
if check_context; then
	echo -e "${RED}ERROR: Context is not null or missing" >&2
	echo -e "$RESET" >&2
	exit 1
fi

policy_document=$(echo "$response" | jq -c '.policyDocument')
statement="$(echo "$policy_document" | jq -c '.Statement[0]')"
statement_effect="$(echo $statement | jq -r '.Effect')"

check_effect_deny

echo -e "${GREEN}Lambda Authorizer Tests Passed"
echo -e "$RESET"
