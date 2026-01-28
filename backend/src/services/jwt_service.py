import os
from datetime import datetime, timedelta, timezone

import jwt


def create_access_token(user_id: str):
    secret = os.getenv("JWT_SECRET", "change_me")
    expires_minutes = int(os.getenv("JWT_EXPIRES_MINUTES", "10080"))
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_token(token: str):
    secret = os.getenv("JWT_SECRET", "change_me")
    return jwt.decode(token, secret, algorithms=["HS256"])

