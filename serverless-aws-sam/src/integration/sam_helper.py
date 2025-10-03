import json
import subprocess
import os
from typing import Dict, Any, Optional


class SAMHelper:
    def __init__(
        self, serverless_base_dir: str, env_vars_file: str = "env-vars/env.json"
    ):
        self.serverless_base_dir = serverless_base_dir
        self.env_vars_file = env_vars_file

    def load_event_template(self, event_file_path: str) -> Dict[str, Any]:
        """Load the base event template from a JSON file."""
        with open(event_file_path, "r") as f:
            return json.load(f)

    def create_api_gateway_event(
        self,
        event_template: Dict[str, Any],
        http_method: str,
        path: str,
        body: str,
        userSub: str = None,
        userName: str = None,
    ) -> Dict[str, Any]:
        """Create an API Gateway event by modifying the template."""
        event = event_template.copy()
        event["httpMethod"] = http_method
        event["path"] = path
        event["body"] = body

        if userSub:
            event["requestContext"]["authorizer"]["sub"] = userSub
        if userName:
            event["requestContext"]["authorizer"]["username"] = userName

        return event

    def local_invoke(self, target_function: str, event: Dict[str, Any]) -> str:
        """Invoke a Lambda function locally using SAM CLI."""
        original_cwd = os.getcwd()
        os.chdir(self.serverless_base_dir)

        try:
            event_json = json.dumps(event)

            cmd = [
                "sam",
                "local",
                "invoke",
                "--add-host",
                "host.docker.internal:host-gateway",
                "--event",
                "-",
                "--env-vars",
                self.env_vars_file,
                target_function,
            ]

            result = subprocess.run(
                cmd,
                input=event_json,
                capture_output=True,
                text=True,
                check=False,  # Don't raise exception on non-zero exit code
            )

            if result.returncode != 0:
                print(f"SAM local invoke failed with return code {result.returncode}")
                print(f"STDERR: {result.stderr}")
                return ""

            # Json response is the last line
            lines = result.stdout.strip().split("\n")
            return lines[-1] if lines else ""

        finally:
            os.chdir(original_cwd)

    def invoke_with_api_event(
        self,
        target_function: str,
        event_template_path: str,
        http_method: str,
        path: str,
        body: str,
        userSub: str = None,
        userName: str = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Convenience method to invoke a function with an API Gateway event.
        Returns the parsed JSON response or None if parsing fails.
        """
        event_template = self.load_event_template(event_template_path)

        event = self.create_api_gateway_event(
            event_template, http_method, path, body, userSub, userName
        )

        response = self.local_invoke(target_function, event)

        try:
            return json.loads(response) if response else None
        except json.JSONDecodeError:
            print(f"Failed to parse response as JSON: {response}")
            return None
