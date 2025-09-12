#!/usr/bin/env python3

import json
import sys
import atexit
import os
import uuid
from dynamodb_helper import DynamoDBHelper
from sam_helper import SAMHelper

GREEN = "\033[1;32m"
RED = "\033[1;31m"
RESET = "\033[0m"


class TestRunner:
    def __init__(self, serverless_base_dir: str, event_template_path: str):
        self.dynamodb_helper = DynamoDBHelper()
        self.sam_helper = SAMHelper(serverless_base_dir)
        self.event_template_path = event_template_path

        atexit.register(self.cleanup)

    def cleanup(self):
        """Clean up resources on exit."""
        print("Cleaning up...")
        self.dynamodb_helper.stop_dynamodb()

    def setup(self):
        """Set up the test environment."""
        print("Setting up test environment...")

        if not self.dynamodb_helper.start_dynamodb():
            print("Failed to start DynamoDB")
            return False

        self.test_user_data = self.dynamodb_helper.get_test_user_data()

        return True

    def verify_room(
        self,
        room_id: str,
        expected_room_name: str,
        room_member_count: int,
        message_count: int,
    ):
        room_info = self.dynamodb_helper.get_item(f"ROOM#{room_id}", "METADATA")
        if not room_info:
            raise Exception("RoomInfo item not found in DynamoDB")

        # Verify RoomInfo fields
        if room_info.get("RoomID") != room_id:
            raise Exception(
                f"RoomInfo RoomID mismatch. Expected: {room_id}, Got: {room_info.get('RoomID')}"
            )

        if room_info.get("roomName") != expected_room_name:
            raise Exception(
                f"RoomInfo roomName mismatch. Expected: {expected_room_name}, Got: {room_info.get('roomName')}"
            )

        if room_info.get("roomMemberCount") != room_member_count:
            raise Exception(
                f"RoomInfo roomMemberCount should be 1. Got: {room_info.get('roomMemberCount')}"
            )

        if room_info.get("messageCount") != message_count:
            raise Exception(
                f"RoomInfo messageCount should be 0. Got: {room_info.get('messageCount')}"
            )

        if not room_info.get("createdAt"):
            raise Exception("RoomInfo createdAt is missing")

        print("✓ RoomInfo verification passed")

        return room_info

    def verify_room_member(
        self,
        room_id: str,
        user_id: str,
        expected_user_name: str,
        room_user_status: str,
        expected_profile_color: str,
    ):
        room_member = self.dynamodb_helper.get_item(
            f"ROOM#{room_id}", f"MEMBERS#USERID#{user_id}"
        )
        if not room_member:
            raise Exception("RoomMember item not found in DynamoDB")

        # Verify RoomMember fields
        if room_member.get("userID") != user_id:
            raise Exception(
                f"RoomMember userID mismatch. Expected: {user_id}, Got: {room_member.get('userID')}"
            )

        if room_member.get("userName") != expected_user_name:
            raise Exception(
                f"RoomMember userName mismatch. Expected: {expected_user_name}, Got: {room_member.get('userName')}"
            )

        if room_member.get("RoomID") != room_id:
            raise Exception(
                f"RoomMember RoomID mismatch. Expected: {room_id}, Got: {room_member.get('RoomID')}"
            )

        if room_member.get("RoomUserStatus") != room_user_status:
            raise Exception(
                f"RoomMember should be {room_user_status}. Got: {room_member.get('RoomUserStatus')}"
            )

        if room_member.get("profileColor") != expected_profile_color:
            raise Exception(
                f"RoomMember profileColor mismatch. Expected: {expected_profile_color}, Got: {room_member.get('profileColor')}"
            )

        if not room_member.get("joinedAt"):
            raise Exception("RoomMember joinedAt is missing")

        print("✓ RoomMember verification passed")

        return room_member

    def verify_room_creation(
        self,
        room_id: str,
        user_id: str,
        expected_room_name: str,
        expected_user_name: str,
        expected_profile_color: str,
    ):
        """
        Verify that a room was properly created in DynamoDB.
        Checks both RoomInfo and RoomMember items.
        """
        print(f"Verifying room creation for room {room_id}...")

        room_info = self.verify_room(room_id, expected_room_name, 1, 0)

        room_member = self.verify_room_member(
            room_id,
            user_id,
            expected_user_name,
            "OWNER",
            expected_profile_color,
        )

        return {"room_info": room_info, "room_member": room_member}

    def verify_join_request(
        self,
        room_id: str,
        from_user_id: str,
        expected_from_user_name: str,
        expected_profile_color: str,
        expected_room_name: str,
    ):
        join_request = self.dynamodb_helper.get_item(
            f"ROOM#{room_id}", f"JOIN_REQUESTS#USERID#{from_user_id}"
        )

        if not join_request:
            raise Exception("JoinRequest item not found in DynamoDB")

        if join_request.get("RoomID") != room_id:
            raise Exception(
                f"JoinRequest RoomID mismatch. Expected: {room_id}, Got: {join_request.get('userID')}"
            )

        if join_request.get("fromUserID") != from_user_id:
            raise Exception(
                f"JoinRequest userID mismatch. Expected: {from_user_id}, Got: {join_request.get('fromUserID')}"
            )

        if join_request.get("fromUserName") != expected_from_user_name:
            raise Exception(
                f" JoinRequest fromUserName mismatch. Expected: {expected_from_user_name}, Got: {join_request.get('fromUserName')}"
            )

        if join_request.get("RoomID") != room_id:
            raise Exception(
                f"JoinRequest RoomID mismatch. Expected: {room_id}, Got: {join_request.get('userID')}"
            )

        if join_request.get("roomName") != expected_room_name:
            raise Exception(
                f"JoinRequest roomName mismatch. Expected: {expected_room_name}, Got: {join_request.get('roomName')}"
            )

        if not join_request.get("sentJoinRequestAt"):
            raise Exception("JoinRequest sentJoinRequestAt is missing")

        if join_request.get("profileColor") != expected_profile_color:
            raise Exception(
                f"JoinRequest profileColor mismatch. Expected: {expected_profile_color}, Got: {join_request.get('profileColor')}"
            )

        expires = join_request.get("expires")
        if not expires or type(expires) != int:
            raise Exception("JoinRequest invalid expires")

        print("✓ JoinRequest verification passed")

    def run_lambda_function(
        self,
        function_name: str,
        http_method: str,
        path: str,
        body: str,
        userSub: str = None,
        userName: str = None,
        starting_message=True,
    ) -> dict:
        """Run a test against a Lambda function."""
        if starting_message:
            print(
                f"{GREEN}Testing {function_name} with {http_method} {path}",
                end=f"{RESET}\n\n",
            )

        response = self.sam_helper.invoke_with_api_event(
            function_name,
            self.event_template_path,
            http_method,
            path,
            body,
            userSub,
            userName,
        )

        return response

    def create_room_test(self):
        roomName = "testRoom"
        body = json.dumps({"roomName": f"{roomName}"})

        response = self.run_lambda_function(
            "createRoom",
            "POST",
            "/rooms/createRoom",
            body,
            self.test_user_data["user_id"],
            self.test_user_data["user_name"],
        )

        if response["statusCode"] != 201:
            raise Exception("Incorrect Status Code, Expected 201")

        responseBody = json.loads(response["body"])

        if not responseBody["message"]:
            raise Exception("No message returned")

        if responseBody["roomInfo"]["roomName"] != roomName:
            raise Exception("Incorrect Room Name")

        # Check whether room was created in dynamodb
        room_id = responseBody["roomInfo"]["RoomID"]

        db_items = self.verify_room_creation(
            room_id=room_id,
            user_id=self.test_user_data["user_id"],
            expected_room_name=roomName,
            expected_user_name=self.test_user_data["user_name"],
            expected_profile_color=self.test_user_data["profile_color"],
        )

        self.roomInfo: dict[str, str] = db_items["room_info"]
        self.roomOwner: dict[str, str] = db_items["room_member"]
        print(f"{GREEN}Passed createRoom tests", end=f"{RESET}\n\n")

    def join_room_test(self):
        # insert a new user
        second_user = {
            "user_id": f"{uuid.uuid4()}",
            "user_name": "second_username",
            "profile_color": "yellow",
        }
        self.dynamodb_helper.insert_test_user(
            self.dynamodb_helper.table_name,
            second_user["user_id"],
            second_user["user_name"],
            second_user["profile_color"],
        )

        # invoke join request with new user info
        body = json.dumps({"RoomID": f"{self.roomInfo["RoomID"]}"})

        response = self.run_lambda_function(
            "joinRoom",
            "POST",
            "/rooms/joinRoom",
            body,
            second_user["user_id"],
            second_user["user_name"],
        )

        if response["statusCode"] != 200:
            raise Exception("Incorrect Status Code, Expected 200")

        responseBody = json.loads(response["body"])

        if not responseBody["message"]:
            raise Exception("No message returned")

        # check database for join request
        self.verify_join_request(
            self.roomInfo["RoomID"],
            second_user["user_id"],
            second_user["user_name"],
            second_user["profile_color"],
            self.roomInfo["roomName"],
        )

        self.second_user = second_user
        print(f"{GREEN}Passed joinRoom tests", end=f"{RESET}\n\n")

    def reject_join_request_test(self):
        body = json.dumps(
            {
                "RoomID": f"{self.roomInfo["RoomID"]}",
                "userID": self.second_user["user_id"],
            }
        )

        # reject second users join request
        response = self.run_lambda_function(
            "rejectJoinRequest",
            "POST",
            "/rooms/rejectJoinRequest",
            body,
            self.test_user_data["user_id"],
            self.test_user_data["user_name"],
        )

        if response["statusCode"] != 200:
            raise Exception("Incorrect Status Code, Expected 200")

        responseBody = json.loads(response["body"])

        if not responseBody["message"]:
            raise Exception("No message returned")

        # verify request doesn't exists in db
        try:
            self.verify_join_request(
                self.roomInfo["RoomID"],
                self.second_user["user_id"],
                self.second_user["user_name"],
                self.second_user["profile_color"],
                self.roomInfo["roomName"],
            )
        except Exception as e:
            if str(e) != "JoinRequest item not found in DynamoDB":
                raise Exception("Failed to remove JoinRequest")
            print("✓ JoinRequest successfully removed")

        print(f"{GREEN}Passed rejectJoinRequest tests", end=f"{RESET}\n\n")

    def accept_join_request_test(self):
        # re-insert second user join request
        self.dynamodb_helper.insert_join_request(
            self.roomInfo["RoomID"],
            self.second_user["user_id"],
            self.second_user["user_name"],
            self.roomInfo["roomName"],
            self.second_user["profile_color"],
        )

        # accept join request
        body = json.dumps(
            {
                "RoomID": f"{self.roomInfo["RoomID"]}",
                "userID": self.second_user["user_id"],
            }
        )
        response = self.run_lambda_function(
            "acceptJoinRequest",
            "POST",
            "/rooms/acceptJoinRequest",
            body,
            self.test_user_data["user_id"],
            self.test_user_data["user_name"],
        )

        if response["statusCode"] != 200:
            raise Exception("Incorrect Status Code, Expected 200")

        responseBody = json.loads(response["body"])

        if not responseBody["message"]:
            raise Exception("No message returned")

        # verify join request is removed
        try:
            self.verify_join_request(
                self.roomInfo["RoomID"],
                self.second_user["user_id"],
                self.second_user["user_name"],
                self.second_user["profile_color"],
                self.roomInfo["roomName"],
            )
        except Exception as e:
            if str(e) != "JoinRequest item not found in DynamoDB":
                raise Exception("Failed to remove JoinRequest")
            print("✓ JoinRequest successfully removed")

        # verify second user is a new room member
        room_member = self.verify_room_member(
            self.roomInfo["RoomID"],
            self.second_user["user_id"],
            self.second_user["user_name"],
            "MEMBER",
            self.second_user["profile_color"],
        )

        self.room_member = room_member
        print(f"{GREEN}Passed acceptJoinRequest tests", end=f"{RESET}\n\n")

    def promote_or_demote_user_test(self):
        def promote_demote_and_verify_member_status(promote_or_demote: str):
            body = json.dumps(
                {
                    "RoomID": f"{self.roomInfo["RoomID"]}",
                    "userID": self.second_user["user_id"],
                    "action": promote_or_demote,
                }
            )
            response = self.run_lambda_function(
                "promoteOrDemoteUser",
                "POST",
                "/rooms/promoteOrDemoteUser",
                body,
                self.test_user_data["user_id"],
                self.test_user_data["user_name"],
                True if promote_or_demote == "PROMOTE" else False,
            )
            # verify response
            if response["statusCode"] != 200:
                raise Exception("Incorrect Status Code, Expected 200")

            responseBody = json.loads(response["body"])

            if not responseBody["message"]:
                raise Exception("No message returned")

            # verify room member with specified status
            self.verify_room_member(
                self.roomInfo["RoomID"],
                self.second_user["user_id"],
                self.second_user["user_name"],
                "ADMIN" if promote_or_demote == "PROMOTE" else "MEMBER",
                self.second_user["profile_color"],
            )

        promote_demote_and_verify_member_status("PROMOTE")
        promote_demote_and_verify_member_status("DEMOTE")
        print(f"{GREEN}Passed acceptJoinRequest tests", end=f"{RESET}\n\n")


def main():
    SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
    SERVERLESS_BASE_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "../.."))
    EVENT_TEMPLATE_PATH = f"{SERVERLESS_BASE_DIR}/events/restAPIEvent.json"

    # sam needs to be ran in the same directory as template file
    os.chdir(SERVERLESS_BASE_DIR)

    runner = TestRunner(SERVERLESS_BASE_DIR, EVENT_TEMPLATE_PATH)

    # starts dynamodb with starting data such as limits and a test user
    if not runner.setup():
        sys.exit(1)

    try:
        runner.create_room_test()
        runner.join_room_test()
        runner.reject_join_request_test()
        runner.accept_join_request_test()
        runner.promote_or_demote_user_test()

    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"{RED}Test failed with error: {e}", end=f"{RESET}\n\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
