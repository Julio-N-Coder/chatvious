import random
import subprocess
import time
import requests
import uuid
from datetime import datetime, timedelta, timezone
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

    def insert_join_request(
        self,
        room_id: str,
        from_user_id: str,
        from_user_name: str,
        room_name: str,
        profile_color: str,
    ):
        """Insert a JoinRequest into the table."""
        current_datetime = datetime.now(timezone.utc)

        self.dynamodb_client.put_item(
            TableName=self.table_name,
            Item={
                "PartitionKey": {"S": f"ROOM#{room_id}"},
                "SortKey": {"S": f"JOIN_REQUESTS#USERID#{from_user_id}"},
                "RoomID": {"S": room_id},
                "fromUserID": {"S": from_user_id},
                "fromUserName": {"S": from_user_name},
                "roomName": {"S": room_name},
                "sentJoinRequestAt": {"S": current_datetime.isoformat()},
                "profileColor": {"S": profile_color},
                "expires": {
                    "N": str(int((current_datetime + timedelta(days=1)).timestamp()))
                },
            },
        )

    def insert_room_member(
        self,
        room_id: str,
        room_name: str,
        user_id: str,
        user_name: str,
        room_user_status: str,
        profile_color: str,
    ):
        """Insert a RoomMember into a Room."""
        current_datetime = datetime.now(timezone.utc)

        self.dynamodb_client.put_item(
            TableName=self.table_name,
            Item={
                "PartitionKey": {"S": f"ROOM#{room_id}"},
                "SortKey": {"S": f"MEMBERS#USERID#{user_id}"},
                "userID": {"S": user_id},
                "userName": {"S": user_name},
                "RoomID": {"S": room_id},
                "RoomUserStatus": {"S": room_user_status},
                "joinedAt": {"S": current_datetime.isoformat()},
                "profileColor": {"S": profile_color},
            },
        )

        self.add_joined_room(user_id, room_id, room_name)

    def insert_multiple_messages(
        self, table_name: str, room_id: str, messages_data: list[dict]
    ):
        """
        Insert multiple messages into the table.

        messages_data should be a list of dicts with keys:
        - message: the message text
        - user_id: user ID
        - user_name: username
        - room_user_status: MEMBER/ADMIN/OWNER
        - profile_color: color
        - message_id: (optional) will generate if not provided
        - sent_at: (optional) will generate if not provided
        """
        # Process messages in batches of 25 (DynamoDB limit)
        batch_size = 25
        inserted_messages = []

        for i in range(0, len(messages_data), batch_size):
            batch = messages_data[i : i + batch_size]
            write_requests = []

            for msg_data in batch:
                # Generate values if not provided
                used_message_id = msg_data.get("message_id", str(uuid.uuid4()))
                used_sent_at = msg_data.get(
                    "sent_at", datetime.now(timezone.utc).isoformat() + "Z"
                )
                sort_key = f"MESSAGES#DATE#{used_sent_at}#MESSAGEID#{used_message_id}"

                write_requests.append(
                    {
                        "PutRequest": {
                            "Item": {
                                "PartitionKey": {"S": f"ROOM#{room_id}"},
                                "SortKey": {"S": sort_key},
                                "message": {"S": msg_data["message"]},
                                "messageId": {"S": used_message_id},
                                "userID": {"S": msg_data["user_id"]},
                                "userName": {"S": msg_data["user_name"]},
                                "RoomUserStatus": {"S": msg_data["room_user_status"]},
                                "profileColor": {"S": msg_data["profile_color"]},
                                "RoomID": {"S": room_id},
                                "sentAt": {"S": used_sent_at},
                            }
                        }
                    }
                )

                inserted_messages.append(
                    {
                        "message_id": used_message_id,
                        "sent_at": used_sent_at,
                        "sort_key": sort_key,
                    }
                )

            self.dynamodb_client.batch_write_item(
                RequestItems={table_name: write_requests}
            )

            print(f"Inserted batch of {len(write_requests)} messages")

        return inserted_messages

    def insert_test_messages(
        self,
        user_id: str,
        user_name: str,
        room_id: str,
        room_user_status: str,
        profile_color: str,
        count=5,
    ):
        """
        Convenience method to insert test messages using the test user data.
        """
        messages_data = []
        for i in range(count):
            messages_data.append(
                {
                    "message": f"Test message {i + 1}",
                    "user_id": user_id,
                    "user_name": user_name,
                    "room_user_status": room_user_status,
                    "profile_color": profile_color,
                }
            )

        return self.insert_multiple_messages(self.table_name, room_id, messages_data)

    def update_user_rooms(
        self, table_name, user_id, room_id, room_name, list_type, action="add"
    ):
        """
        Update ownedRooms or joinedRooms list for a user.

        Args:
            table_name: DynamoDB table name
            user_id: User ID
            room_id: Room ID to add/remove
            room_name: Room name
            list_type: 'owned' or 'joined' (which list to update)
            action: 'add' or 'remove' (default: 'add')
        """
        # Determine attribute type
        if list_type == "owned":
            attribute_name = "ownedRooms"
        elif list_type == "joined":
            attribute_name = "joinedRooms"
        else:
            raise ValueError("list_type must be 'owned' or 'joined'")

        room_object = {"M": {"RoomID": {"S": room_id}, "roomName": {"S": room_name}}}

        if action == "add":
            try:
                self.dynamodb_client.update_item(
                    TableName=table_name,
                    Key={
                        "PartitionKey": {"S": f"USER#{user_id}"},
                        "SortKey": {"S": "PROFILE"},
                    },
                    UpdateExpression=f"SET {attribute_name} = list_append(if_not_exists({attribute_name}, :empty_list), :room_list)",
                    ExpressionAttributeValues={
                        ":empty_list": {"L": []},
                        ":room_list": {"L": [room_object]},
                    },
                )
                print(f"Added room {room_name} to user's {attribute_name}")

            except ClientError as e:
                print(f"Error updating {attribute_name}: {e}")
                raise

        elif action == "remove":
            # Get the current item to find the index to remove
            try:
                response = self.dynamodb_client.get_item(
                    TableName=table_name,
                    Key={
                        "PartitionKey": {"S": f"USER#{user_id}"},
                        "SortKey": {"S": "PROFILE"},
                    },
                )

                if "Item" not in response:
                    raise Exception(f"User {user_id} not found")

                # Find the index of the room to remove
                current_rooms = response["Item"].get(attribute_name, {"L": []})["L"]
                room_index = None

                for i, room in enumerate(current_rooms):
                    if room["M"]["RoomID"]["S"] == room_id:
                        room_index = i
                        break

                if room_index is None:
                    print(f"Room {room_id} not found in user's {attribute_name}")
                    return

                # Remove the room at the found index
                self.dynamodb_client.update_item(
                    TableName=table_name,
                    Key={
                        "PartitionKey": {"S": f"USER#{user_id}"},
                        "SortKey": {"S": "PROFILE"},
                    },
                    UpdateExpression=f"REMOVE {attribute_name}[{room_index}]",
                )
                print(f"Removed room {room_name} from user's {attribute_name}")

            except ClientError as e:
                print(f"Error removing from {attribute_name}: {e}")
                raise
        else:
            raise ValueError("action must be 'add' or 'remove'")

    def add_joined_room(self, user_id: str, room_id: str, room_name: str):
        """Convenience method to add a room to joinedRooms."""
        self.update_user_rooms(
            self.table_name, user_id, room_id, room_name, "joined", "add"
        )

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
