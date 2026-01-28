from datetime import date, datetime, timezone

from bson import ObjectId

from flask import Blueprint, request

from src.db.mongo import get_db
from src.services.auth_middleware import require_auth
from src.services.scheduler_service import GenerateScheduleInput, generate_and_store_schedule, get_latest_schedule

schedule_bp = Blueprint("schedule", __name__)


@schedule_bp.post("/generate")
@require_auth
def generate_schedule():
    body = request.get_json(silent=True) or {}
    start_date = body.get("startDate")
    daily_minutes = int(body.get("dailyStudyMinutes") or 0)

    if not start_date:
        return {"message": "startDate is required"}, 400
    if daily_minutes <= 0:
        return {"message": "dailyStudyMinutes must be > 0"}, 400

    try:
        schedule = generate_and_store_schedule(
            GenerateScheduleInput(
                user_id=request.user["id"],
                start_date=start_date,
                daily_study_minutes=daily_minutes,
            )
        )
    except ValueError as e:
        return {"message": str(e)}, 400

    return {"ok": True, "schedule": schedule}


@schedule_bp.get("/latest")
@require_auth
def latest_schedule():
    latest = get_latest_schedule(request.user["id"])
    return {"schedule": latest}


@schedule_bp.post("/events")
@require_auth
def schedule_event():
    """
    Phase 6 (Adaptive):
    Record task outcome and auto-regenerate schedule.

    Body:
      - taskId: string
      - outcome: "done" | "missed"
      - minutes: number (optional, recommended for accurate analytics)
      - scheduledDate: "YYYY-MM-DD" (optional; defaults to today)
    """
    body = request.get_json(silent=True) or {}
    task_id = (body.get("taskId") or "").strip()
    outcome = (body.get("outcome") or "").strip().lower()
    minutes = body.get("minutes")
    scheduled_date = (body.get("scheduledDate") or "").strip()

    if not task_id:
        return {"message": "taskId is required"}, 400
    if outcome not in {"done", "missed"}:
        return {"message": "outcome must be done or missed"}, 400

    db = get_db()
    now = datetime.now(timezone.utc)

    update = {"$set": {"updatedAt": now}}
    if outcome == "done":
        update = {"$set": {"status": "done", "updatedAt": now}}
    else:
        update = {
            "$set": {"status": "missed", "updatedAt": now, "lastMissedAt": now},
            "$inc": {"missedCount": 1},
        }

    res = db.tasks.update_one(
        {"_id": ObjectId(task_id), "userId": request.user["id"]},
        update,
    )
    if res.matched_count == 0:
        return {"message": "Task not found"}, 404

    # Record event (for analytics and ML training)
    task_doc = db.tasks.find_one(
        {"_id": ObjectId(task_id)},
        {"subjectId": 1, "estimatedMinutes": 1, "difficulty": 1, "topic": 1},
    )
    event_minutes = int(minutes) if minutes is not None else int((task_doc or {}).get("estimatedMinutes") or 0)
    if not scheduled_date:
        scheduled_date = date.today().isoformat()

    if outcome == "missed":
        db.notifications.insert_one({
            "userId": request.user["id"],
            "type": "missed_alert",
            "title": "Missed task",
            "body": f"You missed \"{(task_doc or {}).get('topic', 'Task')}\" on {scheduled_date}.",
            "taskId": task_id,
            "scheduledDate": scheduled_date,
            "read": False,
            "createdAt": now,
        })

    db.task_events.insert_one(
        {
            "userId": request.user["id"],
            "taskId": task_id,
            "subjectId": (task_doc or {}).get("subjectId", ""),
            "estimatedMinutes": (task_doc or {}).get("estimatedMinutes"),
            "difficulty": (task_doc or {}).get("difficulty", "medium"),
            "outcome": outcome,
            "minutes": max(0, event_minutes),
            "scheduledDate": scheduled_date,
            "createdAt": now,
        }
    )

    # Auto-regenerate schedule using latest settings (if available), otherwise defaults
    latest = get_latest_schedule(request.user["id"]) or {}
    daily_minutes = int(latest.get("dailyStudyMinutes") or 120)
    start_date = date.today().isoformat()

    schedule = generate_and_store_schedule(
        GenerateScheduleInput(
            user_id=request.user["id"],
            start_date=start_date,
            daily_study_minutes=daily_minutes,
        )
    )

    return {"ok": True, "schedule": schedule}

