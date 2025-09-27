#!/usr/bin/env bash
set -euo pipefail

get_endpoint_args() {
	if [[ "${USE_LOCAL:-}" == "true" ]]; then
		echo "--endpoint-url http://localhost:8000"
	else
		echo ""
	fi
}

insert_limits_item_custom() {
	local table_name="$1"
	local usersLimit="$2"
	local totalRooms="$3"

	local endpoint_args
	endpoint_args="$(get_endpoint_args)"

	aws $endpoint_args --no-cli-pager dynamodb put-item \
		--table-name "$table_name" \
		--item "{
      \"PartitionKey\": {\"S\": \"LIMITS\"},
      \"SortKey\": {\"S\": \"LIMITS\"},
      \"usersAmount\": {\"N\": \"${usersLimit}\"},
      \"totalRooms\": {\"N\": \"${totalRooms}\"}
    }"
}

insert_limits_item() {
	local table_name="$1"
	insert_limits_item_custom "$table_name" "0" "0"
}

check_and_insert_limits_item() {
	local table_name="$1"

	local endpoint_args
	endpoint_args="$(get_endpoint_args)"

	# attempt to get the item
	local result
	result="$(aws $endpoint_args --no-cli-pager dynamodb get-item \
		--table-name "$table_name" \
		--key '{
      "PartitionKey": {"S": "LIMITS"},
      "SortKey": {"S": "LIMITS"}
    }' \
		--query 'Item' --output json)"

	if [[ "$result" == "null" ]]; then
		echo "LIMITS item not found in $table_name. Inserting..."
		insert_limits_item "$table_name"
	else
		echo "LIMITS item already exists in $table_name."
	fi
}

TABLE_NAME="chatvious"
USE_LOCAL="true"

if [[ "${1:-}" == "--aws" ]]; then
	USE_LOCAL="false"
fi

check_and_insert_limits_item "$TABLE_NAME"
