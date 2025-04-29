# This check only works in bash and it checks to make sure the script is only being sourced.
if !(return 0 2>/dev/null); then
    echo "Can't run script directly"
    exit 1
fi

wait_for_dynamodb() {
    echo "Waiting for DynamoDB to be ready..."
    MAX_WAIT=10
    WAIT_TIME=0

    until curl -s http://localhost:8000 >/dev/null; do
        if [ "$WAIT_TIME" -ge "$MAX_WAIT" ]; then
            echo "DynamoDB did not become ready in time. Exiting."
            exit 1
        fi
        echo "looping"
        WAIT_TIME=$((WAIT_TIME + 1))
        sleep 1
    done
}

create_db_table() {
    table_name=$1

    aws dynamodb create-table \
        --endpoint-url http://localhost:8000 \
        --table-name ${table_name} \
        --attribute-definitions \
        AttributeName=PartitionKey,AttributeType=S \
        AttributeName=SortKey,AttributeType=S \
        --key-schema \
        AttributeName=PartitionKey,KeyType=HASH \
        AttributeName=SortKey,KeyType=RANGE \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        >/dev/null 2>&1
}
