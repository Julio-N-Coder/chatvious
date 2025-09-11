#!/usr/bin/env python3

import json
import sys
import atexit
import os
from dynamodb_helper import DynamoDBHelper
from sam_helper import SAMHelper


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

    def run_lambda_function(
        self,
        function_name: str,
        http_method: str,
        path: str,
        body: str,
        userSub: str = None,
        userName: str = None,
    ) -> dict:
        """Run a test against a Lambda function."""
        print(f"Testing {function_name} with {http_method} {path}")

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
        body = json.dumps({"roomName": "testRoom"})

        response = self.run_lambda_function(
            "createRoom",
            "POST",
            "/rooms/createRoom",
            body,
            self.test_user_data["user_id"],
            self.test_user_data["user_name"],
        )

        # test the response here

        return response


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
        response = runner.create_room_test()

        print(f"Response: {json.dumps(response, indent=2)}")

    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
