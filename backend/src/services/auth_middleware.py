from functools import wraps

from bson import ObjectId
from flask import request

from src.db.mongo import get_db
from src.services.jwt_service import decode_token


def _get_bearer_token():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return auth.replace("Bearer ", "", 1).strip()


def require_auth(fn):
    """
    Adds `request.user` with:
      - id (str)
      - email (str)
      - name (str)
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _get_bearer_token()
        if not token:
            return {"message": "Missing Authorization Bearer token"}, 401

        try:
            payload = decode_token(token)
        except Exception:
            return {"message": "Invalid or expired token"}, 401

        user_id = payload.get("sub")
        if not user_id:
            return {"message": "Invalid token payload"}, 401

        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)}, {"passwordHash": 0})
        if not user:
            return {"message": "User not found"}, 401

        request.user = {
            "id": str(user["_id"]),
            "email": user.get("email", ""),
            "name": user.get("name", ""),
        }
        return fn(*args, **kwargs)

    return wrapper

