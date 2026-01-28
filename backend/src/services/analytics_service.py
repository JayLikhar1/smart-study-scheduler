from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from bson import ObjectId

from src.db.mongo import get_db


def _iso(d: date) -> str:
    return d.isoformat()


def _today_utc_date() -> date:
    return datetime.now(timezone.utc).date()


def get_analytics_summary(user_id: str):
    db = get_db()

    total_tasks = db.tasks.count_documents({"userId": user_id})
    done_tasks = db.tasks.count_documents({"userId": user_id, "status": "done"})
    pending_tasks = db.tasks.count_documents({"userId": user_id, "status": {"$ne": "done"}})

    completion_percent = 0
    if total_tasks > 0:
        completion_percent = round((done_tasks / total_tasks) * 100, 1)

    # Weekly minutes (last 7 days incl today) from "done" events
    today = _today_utc_date()
    start = today - timedelta(days=6)

    events = list(
        db.task_events.find(
            {
                "userId": user_id,
                "outcome": "done",
                "scheduledDate": {"$gte": _iso(start), "$lte": _iso(today)},
            },
            {"scheduledDate": 1, "minutes": 1},
        )
    )

    minutes_by_day = {_iso(start + timedelta(days=i)): 0 for i in range(7)}
    for e in events:
        day = e.get("scheduledDate")
        if day in minutes_by_day:
            minutes_by_day[day] += int(e.get("minutes") or 0)

    last7_labels = list(minutes_by_day.keys())
    last7_minutes = [minutes_by_day[d] for d in last7_labels]
    weekly_minutes = sum(last7_minutes)

    # Streak: consecutive days ending today with any done minutes > 0
    streak = 0
    cursor = today
    while True:
        day_iso = _iso(cursor)
        if minutes_by_day.get(day_iso, 0) > 0:
            streak += 1
            cursor = cursor - timedelta(days=1)
            if cursor < start:
                # extend beyond 7 days by querying as needed
                # To keep complexity reasonable, we extend up to 60 days total.
                if streak >= 60:
                    break
                start = start - timedelta(days=7)
                more = list(
                    db.task_events.find(
                        {
                            "userId": user_id,
                            "outcome": "done",
                            "scheduledDate": {"$gte": _iso(start), "$lte": _iso(cursor)},
                        },
                        {"scheduledDate": 1, "minutes": 1},
                    )
                )
                for i in range(7):
                    k = _iso(start + timedelta(days=i))
                    if k not in minutes_by_day:
                        minutes_by_day[k] = 0
                for e in more:
                    day = e.get("scheduledDate")
                    if day in minutes_by_day:
                        minutes_by_day[day] += int(e.get("minutes") or 0)
            continue
        break

    # Subject-wise minutes (all-time) from done events
    pipeline = [
        {"$match": {"userId": user_id, "outcome": "done"}},
        {"$group": {"_id": "$subjectId", "minutes": {"$sum": "$minutes"}}},
        {"$sort": {"minutes": -1}},
        {"$limit": 10},
    ]
    subject_minutes = list(db.task_events.aggregate(pipeline))
    subject_ids = [s["_id"] for s in subject_minutes if s.get("_id")]

    subjects = list(
        db.subjects.find(
            {"_id": {"$in": [ObjectId(sid) for sid in subject_ids]}},
            {"name": 1},
        )
    )
    subject_name_by_id = {str(s["_id"]): s.get("name", "") for s in subjects}

    subject_chart = [
        {"subjectId": sm["_id"], "subjectName": subject_name_by_id.get(sm["_id"], "Unknown"), "minutes": int(sm["minutes"])}
        for sm in subject_minutes
    ]

    return {
        "tasks": {"total": total_tasks, "done": done_tasks, "pending": pending_tasks},
        "completionPercent": completion_percent,
        "streakDays": streak,
        "weeklyMinutes": weekly_minutes,
        "charts": {
            "last7Days": {"labels": last7_labels, "minutes": last7_minutes},
            "subjectMinutesTop": subject_chart,
        },
    }

