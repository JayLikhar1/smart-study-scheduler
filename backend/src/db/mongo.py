import os

from pymongo import MongoClient

_client = None
_db = None


def init_mongo():
    global _client, _db
    if _db is not None:
        return _db

    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/smart_study_scheduler")
    _client = MongoClient(uri)

    # If the URI contains a db name, MongoClient.get_default_database() works.
    # Otherwise, fall back to a fixed DB name.
    _db = _client.get_default_database()
    if _db is None:
        _db = _client["smart_study_scheduler"]

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

