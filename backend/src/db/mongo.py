import os
from pymongo import MongoClient

_client = None
_db = None


def init_mongo():
    global _client, _db
    if _db is not None:
        return _db

    uri = os.getenv("MONGO_URI")

    # 🚨 Fail fast if env var is missing
    if not uri:
        raise RuntimeError("MONGO_URI environment variable is NOT set")

    # 🛡️ Prevent newline / space bugs
    uri = uri.strip()

    _client = MongoClient(uri)

    # Explicit DB selection (no guessing)
    _db = _client["smart_study_scheduler"]

    # Indexes (safe to call multiple times)
    _db.users.create_index("email", unique=True)
    _db.subjects.create_index([("userId", 1), ("name", 1)], unique=True)
    _db.tasks.create_index([("userId", 1), ("deadline", 1)])
    _db.tasks.create_index([("userId", 1), ("status", 1)])
    _db.schedules.create_index([("userId", 1), ("createdAt", -1)])
    _db.task_events.create_index([("userId", 1), ("createdAt", -1)])
    _db.task_events.create_index([("userId", 1), ("scheduledDate", 1)])
    _db.notifications.create_index([("userId", 1), ("createdAt", -1)])
    _db.notifications.create_index([("userId", 1), ("read", 1)])

    return _db


def get_db():
    if _db is None:
        return init_mongo()
    return _db


