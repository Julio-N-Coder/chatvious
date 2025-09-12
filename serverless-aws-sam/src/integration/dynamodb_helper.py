import random
import subprocess
import time
import requests
import uuid
import boto3
from botocore.exceptions import ClientError


class DynamoDBHelper:
    def __init__(
        self, container_name="dynamodb-local", port=8000, table_name="chatvious"
    ):
        self.table_name = table_name
        self.container_name = container_name
        self.port = port
        self.endpoint_url = f"http://localhost:{port}"
        self.is_started = False
        self.dynamodb_client = boto3.client(
            "dynamodb",
            endpoint_url=self.endpoint_url,
            region_name="us-west-1",
            aws_access_key_id="dummy",
            aws_secret_access_key="dummy",
        )

    def check_for_dynamodb(self):
        """Check if DynamoDB is running on the specified port."""
        try:
            response = requests.get(self.endpoint_url, timeout=2)
            return response.status_code == 400  # DynamoDB returns 400 for root endpoint
        except requests.exceptions.RequestException:
            return False

    def wait_for_dynamodb(self, max_wait=10):
        """Wait for DynamoDB to be ready."""
        print("Waiting for DynamoDB to be ready...")
        wait_time = 0

        while wait_time < max_wait:
            if self.check_for_dynamodb():
                print("DynamoDB is ready.")
                return True

            print("waiting...")
            time.sleep(1)
            wait_time += 1

        print("DynamoDB did not become ready in time. Exiting.")
        return False

    def check_dynamodb_table_exists(self, table_name):
        """Check if a DynamoDB table exists."""
        try:
            self.dynamodb_client.describe_table(TableName=table_name)
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                return False
            raise

    def create_db_table(self, table_name):
        """Create a DynamoDB table with PartitionKey and SortKey."""
        try:
            self.dynamodb_client.create_table(
                TableName=table_name,
                AttributeDefinitions=[
                    {"AttributeName": "PartitionKey", "AttributeType": "S"},
                    {"AttributeName": "SortKey", "AttributeType": "S"},
                ],
                KeySchema=[
                    {"AttributeName": "PartitionKey", "KeyType": "HASH"},
                    {"AttributeName": "SortKey", "KeyType": "RANGE"},
                ],
                ProvisionedThroughput={"ReadCapacityUnits": 1, "WriteCapacityUnits": 1},
            )
            print(f"Created table: {table_name}")
        except ClientError as e:
            if e.response["Error"]["Code"] != "ResourceInUseException":
                raise

    def insert_limits_item_custom(self, table_name, users_limit, total_rooms):
        """Insert a custom limits item into the table."""
        self.dynamodb_client.put_item(
            TableName=table_name,
            Item={
                "PartitionKey": {"S": "LIMITS"},
                "SortKey": {"S": "LIMITS"},
                "usersAmount": {"N": str(users_limit)},
                "totalRooms": {"N": str(total_rooms)},
            },
        )

    def insert_limits_item(self, table_name):
        """Insert default limits item (0, 0) into the table."""
        self.insert_limits_item_custom(table_name, 0, 0)

    def get_random_color(self):
        """Get a random profile color."""
        colors = ["blue", "green", "orange", "yellow", "sky", "purple", "pink"]
        return random.choice(colors)

    def insert_test_user(
        self, table_name, user_id=None, user_name=None, profile_color=None
    ):
        """Insert a test user into the table."""
        # Generate or use provided values
        used_user_id = user_id if user_id else str(uuid.uuid4())
        used_user_name = user_name if user_name else "test_user"
        used_profile_color = profile_color if profile_color else self.get_random_color()

        self.test_user_id = used_user_id
        self.test_user_name = used_user_name
        self.test_user_color = used_profile_color

        self.dynamodb_client.put_item(
            TableName=table_name,
            Item={
                "PartitionKey": {"S": f"USER#{used_user_id}"},
                "SortKey": {"S": "PROFILE"},
                "userID": {"S": used_user_id},
                "userName": {"S": used_user_name},
                "hashedPassword": {"S": "fakePassword"},
                "profileColor": {"S": used_profile_color},
                "ownedRooms": {"L": []},
                "joinedRooms": {"L": []},
            },
        )
        print(f"Inserted test user: {used_user_name} (ID: {used_user_id})")

    def get_test_user_data(self):
        """Get the test user data."""
        return {
            "user_id": self.test_user_id,
            "user_name": self.test_user_name,
            "profile_color": self.test_user_color,
        }

    def get_item(self, partition_key: str, sort_key: str):
        """Get an item from DynamoDB by partition key and sort key."""
        try:
            response = self.dynamodb_client.get_item(
                TableName=self.table_name,
                Key={"PartitionKey": {"S": partition_key}, "SortKey": {"S": sort_key}},
            )

            if "Item" in response:
                # Convert DynamoDB format to regular dict
                return self._convert_dynamodb_item(response["Item"])
            else:
                return None

        except ClientError as e:
            print(f"Error getting item: {e}")
            return None

    def _convert_dynamodb_item(self, item):
        """Convert DynamoDB item format to regular Python dict."""
        converted = {}
        for key, value in item.items():
            if "S" in value:  # String
                converted[key] = value["S"]
            elif "N" in value:  # Number
                converted[key] = (
                    int(value["N"]) if "." not in value["N"] else float(value["N"])
                )
            elif "L" in value:  # List
                converted[key] = [self._convert_dynamodb_value(v) for v in value["L"]]
            elif "M" in value:  # Map
                converted[key] = self._convert_dynamodb_item(value["M"])
            elif "BOOL" in value:
                converted[key] = value["BOOL"]
            elif "NULL" in value:
                converted[key] = None
        return converted

    def _convert_dynamodb_value(self, value):
        """Convert a single DynamoDB value to Python value."""
        if "S" in value:
            return value["S"]
        elif "N" in value:
            return int(value["N"]) if "." not in value["N"] else float(value["N"])
        elif "L" in value:
            return [self._convert_dynamodb_value(v) for v in value["L"]]
        elif "M" in value:
            return self._convert_dynamodb_item(value["M"])
        elif "BOOL" in value:
            return value["BOOL"]
        elif "NULL" in value:
            return None
        return value

    def start_dynamodb_container(self):
        """Start DynamoDB container."""
        # Check if container is already running
        try:
            result = subprocess.run(
                [
                    "docker",
                    "ps",
                    "--filter",
                    f"name={self.container_name}",
                    "--format",
                    "{{.Names}}",
                ],
                capture_output=True,
                text=True,
                check=True,
            )
            if self.container_name in result.stdout:
                print(f"DynamoDB container {self.container_name} is already running")
                return True
        except subprocess.CalledProcessError:
            pass

        # Start the container
        try:
            subprocess.run(
                [
                    "docker",
                    "run",
                    "-d",
                    "--name",
                    self.container_name,
                    "-p",
                    f"{self.port}:8000",
                    "amazon/dynamodb-local",
                    "-jar",
                    "DynamoDBLocal.jar",
                    "-inMemory",
                    "-sharedDb",
                ],
                check=True,
                capture_output=True,
            )
            print(f"Started DynamoDB container: {self.container_name}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Failed to start DynamoDB container: {e}")
            return False

    def start_dynamodb(self):
        """Start DynamoDB and set up the table."""
        if self.check_for_dynamodb():
            if not self.check_dynamodb_table_exists(self.table_name):
                self.create_db_table(self.table_name)
                self.insert_limits_item(self.table_name)
                self.insert_test_user(self.table_name)
        else:
            if not self.start_dynamodb_container():
                return False

            if not self.wait_for_dynamodb():
                return False

            self.create_db_table(self.table_name)
            self.insert_limits_item(self.table_name)
            self.insert_test_user(self.table_name)

        print("DynamoDB is ready.")
        self.is_started = True
        return True

    def stop_dynamodb(self):
        """Stop and remove the DynamoDB container."""
        if self.is_started:
            print("Stopping and removing dynamodb container")
            try:
                subprocess.run(
                    ["docker", "stop", self.container_name],
                    capture_output=True,
                    check=False,
                )
                subprocess.run(
                    ["docker", "rm", self.container_name],
                    capture_output=True,
                    check=False,
                )
            except Exception as e:
                print(f"Error stopping container: {e}")
            self.is_started = False
