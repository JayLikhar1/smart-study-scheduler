from datetime import date

from bson import ObjectId

from flask import Blueprint, request

from src.db.mongo import get_db
from src.services.auth_middleware import require_auth
from src.services.scheduler_service import get_latest_schedule

notifications_bp = Blueprint("notifications", __name__)


def _compute_reminder(user_id: str):
    """Study reminder from latest schedule: today's planned tasks."""
    latest = get_latest_schedule(user_id)
    if not latest or not latest.get("days"):
        return None
    today = date.today().isoformat()
    for d in latest["days"]:
        if d.get("date") == today:
            items = d.get("items") or []
            n = len(items)
            if n > 0:
                return {
                    "type": "study_reminder",
                    "title": "Study reminder",
                    "body": f"You have {n} task{'s' if n != 1 else ''} planned for today.",
                    "taskCount": n,
                    "date": today,
                }
    return None


@notifications_bp.get("")
@require_auth
def list_notifications():
    """Stored notifications (e.g. missed_alert) + computed study reminder."""
    db = get_db()
    docs = list(
        db.notifications.find({"userId": request.user["id"]})
        .sort("createdAt", -1)
        .limit(50)
    )
    items = [
        {
            "id": str(d["_id"]),
            "type": d.get("type", ""),
            "title": d.get("title", ""),
            "body": d.get("body", ""),
            "read": bool(d.get("read", False)),
            "taskId": d.get("taskId"),
            "scheduledDate": d.get("scheduledDate"),
            "createdAt": d.get("createdAt"),
        }
        for d in docs
    ]
    reminder = _compute_reminder(request.user["id"])
    unread_count = sum(1 for i in items if not i["read"])
    return {"items": items, "reminder": reminder, "unreadCount": unread_count}


@notifications_bp.patch("/<notification_id>")
@require_auth
def mark_read(notification_id: str):
    """Mark a stored notification as read."""
    db = get_db()
    res = db.notifications.update_one(
        {"_id": ObjectId(notification_id), "userId": request.user["id"]},
        {"$set": {"read": True}},
    )
    if res.matched_count == 0:
        return {"message": "Notification not found"}, 404
    return {"ok": True}
