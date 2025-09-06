#!/usr/bin/env python3
"""
Only Generates a Refresh tokens for now
"""
from datetime import datetime, timedelta, timezone
import jwt
import os

dirname = os.path.dirname
FILE_DIR = os.path.abspath(dirname(__file__))
KEYS_DIR = os.path.join(dirname(FILE_DIR), "aws-mock/keys")


def main():
    private_key_path = os.path.join(KEYS_DIR, "private_key.pem")
    if not os.path.exists(private_key_path):
        raise FileNotFoundError(f"Private key not found at {private_key_path}")

    with open(private_key_path, "r") as f:
        private_key = f.read()

    now_time = datetime.now(timezone.utc)
    payload = {
        "sub": "USER#123",
        "exp": int((now_time + timedelta(minutes=15)).timestamp()),
        "iat": int(now_time.timestamp()),
        "token_use": "refresh",
        "username": "test_user",
    }

    token = jwt.encode(payload, private_key, algorithm="EdDSA")
    print(token)


if __name__ == "__main__":
    main()
