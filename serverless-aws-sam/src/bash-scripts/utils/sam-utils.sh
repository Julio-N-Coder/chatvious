if !(return 0 2>/dev/null); then
	echo "Can't run script directly"
	exit 1
fi

BASH_SCRIPTS_DIR="$(dirname "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)")"
SERVERLESS_BASE_DIR="$(dirname "$(dirname "$BASH_SCRIPTS_DIR")")"
SAM_TEMPLATE="${SERVERLESS_BASE_DIR}/template.yaml"

get_lambda_function_ids() {
	# Collect function logical IDs (unquoted, one per line)
	mapfile -t FUNCTION_IDS < <(
		yq -r '.Resources
            | with_entries(select(.value.Type == "AWS::Serverless::Function"))
            | keys[]' "$SAM_TEMPLATE" | sed -e 's/\r$//'
	)
}

verify_lambda_function_exists() {
	TARGET="$1"
	get_lambda_function_ids

	if ((${#FUNCTION_IDS[@]} == 0)); then
		echo "No AWS::Serverless::Function resources found in" >&2
		echo "$SAM_TEMPLATE" >&2
		exit 1
	fi

	# Exact whole-line match (no regex interpretation)
	if !(printf '%s\n' "${FUNCTION_IDS[@]}" | grep -Fxq -- "$TARGET"); then
		echo "Error: '$TARGET' is not a function logical id in $SAM_TEMPLATE" >&2
		echo "Available function ids:" >&2
		printf '  - %s\n' "${FUNCTION_IDS[@]}" >&2
		exit 1
	fi
}

rest_api_event_custom_common() {
	local http_method="$1"
	local path="$2"
	local body="$3"
	local base_event_file="${SERVERLESS_BASE_DIR}/events/restAPIEvent.json"

	if ! [ -f "$base_event_file" ]; then
		echo "Error: Base event file $base_event_file not found"
		return 1
	fi

	if [[ -z "$http_method" || -z "$path" ]]; then
		echo "Usage: rest_api_event_custom_common <http_method> <path> [body_json] | 'sam command'"
		echo "Example: rest_api_event_custom_common 'GET' '/signinup' '{\"username\":\"test\"}' | 'sam command'"
		return 1
	fi

	if [[ -z "$body" ]]; then
		body_json='""'
	else
		# Escape the body JSON for embedding in the event
		body_json=$(echo "$body" | jq -R .)
	fi

	jq --arg method "$http_method" \
		--arg path "$path" \
		--argjson body "$body_json" \
		'.httpMethod = $method | .path = $path | .body = $body' \
		"$base_event_file"
}

local_invoke_stdin() {
	TARGET="$1"
	cd "$SERVERLESS_BASE_DIR"

	sam local invoke --add-host host.docker.internal:host-gateway \
		--event "-" \
		--env-vars "env-vars/env.json" "$TARGET"
}
