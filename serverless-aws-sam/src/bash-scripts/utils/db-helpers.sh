# This check only works in bash and it checks to make sure the script is only being sourced.
if !(return 0 2>/dev/null); then
	echo "Can't run script directly"
	exit 1
fi

wait_for_dynamodb() {
	echo "Waiting for DynamoDB to be ready..."
	MAX_WAIT=10
	WAIT_TIME=0

	until check_for_dynamodb; do
		if [ "$WAIT_TIME" -ge "$MAX_WAIT" ]; then
			echo "DynamoDB did not become ready in time. Exiting."
			exit 1
		fi
		echo "looping"
		WAIT_TIME=$((WAIT_TIME + 1))
		sleep 1
	done
}

check_for_dynamodb() {
	if curl -s http://localhost:8000 >/dev/null; then
		return 0
	fi
	return 1
}

check_dynamodb_table_exists() {
	local table_name="$1"
	local endpoint="http://localhost:8000"

	if aws dynamodb describe-table --table-name "$table_name" --endpoint-url "$endpoint" >/dev/null 2>&1; then
		return 0
	fi
	return 1
}

create_db_table() {
	local table_name=$1

	aws dynamodb create-table \
		--endpoint-url http://localhost:8000 \
		--table-name ${table_name} \
		--attribute-definitions \
		AttributeName=PartitionKey,AttributeType=S \
		AttributeName=SortKey,AttributeType=S \
		--key-schema \
		AttributeName=PartitionKey,KeyType=HASH \
		AttributeName=SortKey,KeyType=RANGE \
		--provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
		>/dev/null 2>&1
}

insert_limits_item_custom() {
	local table_name="$1"
	local usersLimit="$2"
	local totalRooms="$3"
	local messagesPerRoom="$4"

	aws --endpoint-url http://localhost:8000 --no-cli-pager dynamodb put-item \
		--table-name "$table_name" \
		--item "{
 				  \"PartitionKey\": {\"S\": \"LIMITS\"},
 				  \"SortKey\": {\"S\": \"LIMITS\"},
 				  \"usersAmount\": {\"N\": \"${usersLimit}\"},
				  \"totalRooms\": {\"N\": \"${totalRooms}\"},
				  \"messagesPerRoom\": {\"N\": \"${messagesPerRoom}\"}
 				}"
}

insert_limits_item() {
	local table_name="$1"

	insert_limits_item_custom "$table_name" "0" "0" "0"
}

get_db_item() {
	local user_sub="$1"
	local table_name="$2"

	aws --endpoint-url http://localhost:8000 --no-cli-pager dynamodb get-item \
		--table-name "$table_name" \
		--key "{
       \"PartitionKey\": {\"S\": \"USER#$user_sub\"},
       \"SortKey\": {\"S\": \"PROFILE\"}
   }"
}
