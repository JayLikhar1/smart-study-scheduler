from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, request

from src.db.mongo import get_db
from src.models.task_model import ALLOWED_DIFFICULTY, ALLOWED_STATUS, TaskCreate
from src.services.auth_middleware import require_auth

task_bp = Blueprint("tasks", __name__)


def _to_task_response(doc):
    return {
        "id": str(doc["_id"]),
        "subjectId": doc.get("subjectId", ""),
        "topic": doc.get("topic", ""),
        "difficulty": doc.get("difficulty", "medium"),
        "estimatedMinutes": doc.get("estimatedMinutes", 0),
        "deadline": doc.get("deadline", ""),
        "status": doc.get("status", "pending"),
        "missedCount": doc.get("missedCount", 0),
    }


@task_bp.get("")
@require_auth
def list_tasks():
    status = request.args.get("status")
    subject_id = request.args.get("subjectId")

    query = {"userId": request.user["id"]}
    if status:
        if status not in ALLOWED_STATUS:
            return {"message": "Invalid status filter"}, 400
        query["status"] = status
    if subject_id:
        query["subjectId"] = subject_id

    db = get_db()
    docs = list(
        db.tasks.find(query).sort([("deadline", 1), ("difficulty", -1), ("createdAt", 1)])
    )
    return {"items": [_to_task_response(d) for d in docs]}


@task_bp.post("")
@require_auth
def create_task():
    body = request.get_json(silent=True) or {}
    subject_id = (body.get("subjectId") or "").strip()
    topic = (body.get("topic") or "").strip()
    difficulty = (body.get("difficulty") or "medium").strip().lower()
    estimated_minutes = int(body.get("estimatedMinutes") or 0)
    deadline = (body.get("deadline") or "").strip()  # YYYY-MM-DD

    if not subject_id:
        return {"message": "subjectId is required"}, 400
    if not topic:
        return {"message": "topic is required"}, 400
    if difficulty not in ALLOWED_DIFFICULTY:
        return {"message": "difficulty must be low, medium, or high"}, 400
    if estimated_minutes <= 0:
        return {"message": "estimatedMinutes must be > 0"}, 400
    if not deadline:
        return {"message": "deadline is required (YYYY-MM-DD)"}, 400

    db = get_db()
    subject = db.subjects.find_one(
        {"_id": ObjectId(subject_id), "userId": request.user["id"]}
    )
    if not subject:
        return {"message": "Subject not found"}, 404

    task = TaskCreate(
        user_id=request.user["id"],
        subject_id=subject_id,
        topic=topic,
        difficulty=difficulty,
        estimated_minutes=estimated_minutes,
        deadline=deadline,
    )
    result = db.tasks.insert_one(task.to_doc())
    doc = db.tasks.find_one({"_id": result.inserted_id})
    return _to_task_response(doc), 201


@task_bp.patch("/<task_id>")
@require_auth
def update_task(task_id: str):
    body = request.get_json(silent=True) or {}
    updates = {}
    inc = {}

    if "status" in body:
        status = (body.get("status") or "").strip().lower()
        if status not in ALLOWED_STATUS:
            return {"message": "status must be pending, done, or missed"}, 400
        updates["status"] = status
        if status == "missed":
            inc["missedCount"] = 1

    if "difficulty" in body:
        difficulty = (body.get("difficulty") or "").strip().lower()
        if difficulty not in ALLOWED_DIFFICULTY:
            return {"message": "difficulty must be low, medium, or high"}, 400
        updates["difficulty"] = difficulty

    if "estimatedMinutes" in body:
        estimated_minutes = int(body.get("estimatedMinutes") or 0)
        if estimated_minutes <= 0:
            return {"message": "estimatedMinutes must be > 0"}, 400
        updates["estimatedMinutes"] = estimated_minutes

    if "deadline" in body:
        deadline = (body.get("deadline") or "").strip()
        if not deadline:
            return {"message": "deadline is required (YYYY-MM-DD)"}, 400
        updates["deadline"] = deadline

    if not updates:
        return {"message": "No valid fields to update"}, 400

    updates["updatedAt"] = datetime.now(timezone.utc)

    db = get_db()
    op = {"$set": updates}
    if inc:
        op["$inc"] = inc
        op["$set"]["lastMissedAt"] = datetime.now(timezone.utc)

    res = db.tasks.update_one(
        {"_id": ObjectId(task_id), "userId": request.user["id"]},
        op,
    )
    if res.matched_count == 0:
        return {"message": "Task not found"}, 404

    doc = db.tasks.find_one({"_id": ObjectId(task_id)})
    return _to_task_response(doc)


@task_bp.delete("/<task_id>")
@require_auth
def delete_task(task_id: str):
    db = get_db()
    res = db.tasks.delete_one(
        {"_id": ObjectId(task_id), "userId": request.user["id"]}
    )
    if res.deleted_count == 0:
        return {"message": "Task not found"}, 404
    return {"ok": True}

