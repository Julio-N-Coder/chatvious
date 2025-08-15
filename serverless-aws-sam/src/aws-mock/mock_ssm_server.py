#!/usr/bin/env python3
"""
Lightweight mock AWS SSM Parameter Store server for local development.
Reads parameters from a JSON file and serves them via AWS-compatible API.
"""

import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import xml.etree.ElementTree as ET
from datetime import datetime
import hashlib

FILE_DIR = os.path.abspath(os.path.dirname(__file__))


class MockSSMHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Load parameters from config file
        self.load_parameters()
        super().__init__(*args, **kwargs)

    def load_parameters(self):
        """Load parameters from parameters.json file"""
        config_file = os.getenv("SSM_PARAMETERS_FILE", f"{FILE_DIR}/parameters.json")

        try:
            with open(config_file, "r") as f:
                self.parameters = json.load(f)
        except FileNotFoundError:
            print(f"File Not Found. File: {config_file}: {e}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"Error parsing {config_file}: {e}")
            sys.exit(1)

    def do_POST(self):
        """Handle POST requests (AWS SDK uses POST for SSM operations)"""
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        # Parse the AWS API request
        target = self.headers.get("X-Amz-Target", "")

        # Handle both SDK and CLI target formats
        if target in [
            "AWSSimpleSystemsManagement.GetParameter",
            "AmazonSSM.GetParameter",
        ]:
            self.handle_get_parameter(post_data)
        else:
            self.send_error_response("UnknownOperation", f"Unknown operation: {target}")

    def handle_get_parameter(self, post_data):
        """Handle GetParameter requests"""
        try:
            # Parse JSON request body
            request_data = json.loads(post_data.decode("utf-8"))
            parameter_name = request_data.get("Name", "")
            with_decryption = request_data.get("WithDecryption", False)

            if not with_decryption:
                print("Make sure to specify to decrypt keys")

            if parameter_name in self.parameters:
                param = self.parameters[parameter_name]

                # read key from file
                value = ""
                with open(os.path.join(FILE_DIR, param["value"]), "r") as f:
                    value = f.read()

                response = {
                    "Parameter": {
                        "Name": parameter_name,
                        "Type": param.get("type", "String"),
                        "Value": value,
                        "Version": param.get("version", 1),
                        "LastModifiedDate": param.get(
                            "last_modified", datetime.now().isoformat()
                        ),
                        "ARN": f"arn:aws:ssm:us-east-1:123456789012:parameter{parameter_name}",
                        "DataType": "text",
                    }
                }

                self.send_json_response(response)
            else:
                self.send_error_response(
                    "ParameterNotFound", f"Parameter {parameter_name} not found."
                )

        except json.JSONDecodeError:
            self.send_error_response("InvalidRequest", "Invalid JSON in request body")
        except Exception as e:
            print(f"Error handling GetParameter: {e}")
            self.send_error_response("InternalError", "Internal server error")

    def send_json_response(self, data):
        """Send a JSON response"""
        response_json = json.dumps(data)

        self.send_response(200)
        self.send_header("Content-Type", "application/x-amz-json-1.1")
        self.send_header("Content-Length", str(len(response_json)))
        self.send_header("x-amzn-RequestId", self.generate_request_id())
        self.end_headers()

        self.wfile.write(response_json.encode("utf-8"))

    def send_error_response(self, error_code, message):
        """Send an error response"""
        error_response = {
            "__type": f"com.amazon.coral.service#{error_code}",
            "message": message,
        }

        response_json = json.dumps(error_response)

        self.send_response(400)
        self.send_header("Content-Type", "application/x-amz-json-1.1")
        self.send_header("Content-Length", str(len(response_json)))
        self.send_header("x-amzn-RequestId", self.generate_request_id())
        self.end_headers()

        self.wfile.write(response_json.encode("utf-8"))

    def generate_request_id(self):
        """Generate a mock AWS request ID"""
        return hashlib.md5(f"{datetime.now().isoformat()}".encode()).hexdigest()

    def log_message(self, format, *args):
        """Override to reduce noise in logs"""
        pass  # Suppress default HTTP logs


def main():
    port = int(os.getenv("SSM_MOCK_PORT", 8009))

    server = HTTPServer(("localhost", port), MockSSMHandler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Mock SSM server...")
        server.shutdown()


if __name__ == "__main__":
    main()
