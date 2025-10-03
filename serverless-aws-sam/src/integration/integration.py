#!/usr/bin/env python3

import os
import sys
import subprocess
import venv
import shutil


class VirtualEnvironmentManager:
    def __init__(self):
        """
        Initialize Virtual Environment Manager
        """
        self.base_dir = os.path.abspath(os.path.dirname(__file__))
        self.venv_dir = os.path.join(self.base_dir, ".venv")

    def create_virtual_environment(self) -> bool:
        """
        Create a new virtual environment

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if os.path.exists(self.venv_dir):
                print(f"Virtual environment already exists at {self.venv_dir}")
                return True

            venv.create(self.venv_dir, with_pip=True)
            print(f"Virtual environment created at {self.venv_dir}")
            return True

        except Exception as e:
            print(f"Error creating virtual environment: {e}")
            return False

    def install_requirements(self, requirements_file: str = "requirements.txt") -> bool:
        """
        Install dependencies from requirements.txt

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            req_path = os.path.join(self.base_dir, requirements_file)

            if not os.path.exists(req_path):
                print(f"Requirements file not found: {req_path}")
                return False

            pip_path = os.path.join(self.venv_dir, "bin", "pip")
            if sys.platform == "win32":
                pip_path = os.path.join(self.venv_dir, "Scripts", "pip")

            result = subprocess.run(
                [pip_path, "install", "-r", req_path], capture_output=True, text=True
            )

            if result.returncode == 0:
                print("Dependencies installed successfully")
                return True
            else:
                print("Error installing dependencies:")
                print(result.stderr)
                return False

        except Exception as e:
            print(f"Error installing requirements: {e}")
            return False

    def run_in_virtual_environment(
        self, script_path: str = "test_runner.py", script_args: list[str] = None
    ):
        """
        Run a Python script within the virtual environment

        Returns:
            subprocess.CompletedProcess: Result of script execution
        """
        try:
            if not os.path.exists(self.venv_dir):
                print("Virtual environment does not exist. Creating now.")
                self.create_virtual_environment()

            python_path = os.path.join(self.venv_dir, "bin", "python")
            if sys.platform == "win32":
                python_path = os.path.join(self.venv_dir, "Scripts", "python")

            cmd = [python_path, script_path]
            if script_args:
                cmd.extend(script_args)

            process_response = subprocess.run(cmd, text=True)
            return process_response

        except Exception as e:
            print(f"Error running script in virtual environment: {e}")
            return None

    def cleanup(self):
        try:
            if os.path.exists(self.venv_dir):
                shutil.rmtree(self.venv_dir)
                print(f"Removed virtual environment at {self.venv_dir}")
        except Exception as e:
            print(f"Error removing virtual environment: {e}")


def main():
    venv_manager = VirtualEnvironmentManager()

    try:
        if not venv_manager.create_virtual_environment():
            venv_manager.cleanup()

        venv_manager.install_requirements()

        integration_file = os.path.join(venv_manager.base_dir, "test_runner.py")
        venv_manager.run_in_virtual_environment(integration_file)

    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
