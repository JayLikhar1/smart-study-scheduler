from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from bson import ObjectId

from src.db.mongo import get_db
from src.services.ml_service import get_predicted_minutes


DIFFICULTY_RANK = {"low": 1, "medium": 2, "high": 3}
NEAR_DEADLINE_DAYS = 7


def _parse_yyyy_mm_dd(s: str) -> date:
    return date.fromisoformat(s)


def _to_yyyy_mm_dd(d: date) -> str:
    return d.isoformat()


@dataclass
class GenerateScheduleInput:
    user_id: str
    start_date: str  # YYYY-MM-DD
    daily_study_minutes: int


def generate_and_store_schedule(inp: GenerateScheduleInput):
    """
    Rule-based scheduler (Phase 5):
    - Take user's pending tasks
    - Sort by deadline asc, then difficulty desc (high > medium > low)
    - Distribute work into dailyStudyMinutes starting at startDate
    - Tasks can be split across days if they don't fit in one day
    """
    if inp.daily_study_minutes <= 0:
        raise ValueError("dailyStudyMinutes must be > 0")

    start = _parse_yyyy_mm_dd(inp.start_date)
    db = get_db()

    # Include pending + missed (anything not done is still schedulable)
    tasks = list(
        db.tasks.find(
            {"userId": inp.user_id, "status": {"$ne": "done"}},
            {
                "_id": 1,
                "subjectId": 1,
                "topic": 1,
                "difficulty": 1,
                "estimatedMinutes": 1,
                "deadline": 1,
                "status": 1,
                "missedCount": 1,
            },
        )
    )

    def sort_key(t):
        # deadline first (string YYYY-MM-DD sorts lexicographically)
        deadline = t.get("deadline") or "9999-12-31"
        diff_rank = DIFFICULTY_RANK.get((t.get("difficulty") or "medium").lower(), 2)
        missed_count = int(t.get("missedCount") or 0)

        # Adaptive rule: near exams/deadlines => boost priority (as a tiebreaker)
        try:
            days_left = (_parse_yyyy_mm_dd(deadline) - start).days
        except Exception:
            days_left = 999999
        near_deadline_boost = 1 if days_left <= NEAR_DEADLINE_DAYS else 0

        # Keep the required primary rules:
        # 1) deadline asc
        # 2) difficulty desc
        # then apply adaptive tiebreakers:
        # - near deadline first
        # - missedCount higher first
        return (deadline, -diff_rank, -near_deadline_boost, -missed_count)

    tasks.sort(key=sort_key)

    # Remaining minutes per taskId — use ML prediction when we have enough history
    task_meta = {}  # task_id -> { minutes, minutesSource, mlExplain }
    for t in tasks:
        tid = str(t["_id"])
        pred, explain = get_predicted_minutes(t, inp.user_id)
        est = int(t.get("estimatedMinutes") or 0)
        if pred is not None and explain:
            task_meta[tid] = {"minutes": pred, "minutesSource": "ml_prediction", "mlExplain": explain}
        else:
            task_meta[tid] = {"minutes": max(1, est), "minutesSource": "estimated", "mlExplain": None}

    remaining = {tid: m["minutes"] for tid, m in task_meta.items()}

    # Adaptive rule: if any task is missed twice+, reduce daily workload a bit
    max_missed = max([int(t.get("missedCount") or 0) for t in tasks], default=0)
    effective_daily_minutes = inp.daily_study_minutes
    if max_missed >= 2:
        # reduce by 20%, but keep a sensible minimum so user still progresses
        effective_daily_minutes = max(30, int(inp.daily_study_minutes * 0.8))

    days = []
    day_index = 0

    # If no tasks, still store an empty schedule
    while True:
        if all(m <= 0 for m in remaining.values()):
            break

        current_date = start + timedelta(days=day_index)
        day_index += 1

        capacity = effective_daily_minutes
        items = []

        for t in tasks:
            if capacity <= 0:
                break

            task_id = str(t["_id"])
            rem = remaining.get(task_id, 0)
            if rem <= 0:
                continue

            allocate = min(rem, capacity)
            remaining[task_id] = rem - allocate
            capacity -= allocate

            meta = task_meta.get(task_id, {})
            items.append(
                {
                    "taskId": task_id,
                    "subjectId": t.get("subjectId", ""),
                    "topic": t.get("topic", ""),
                    "difficulty": (t.get("difficulty") or "medium").lower(),
                    "deadline": t.get("deadline") or "",
                    "minutes": allocate,
                    "isPartial": allocate < rem,
                    "sourceStatus": t.get("status", "pending"),
                    "missedCount": int(t.get("missedCount") or 0),
                    "minutesSource": meta.get("minutesSource", "estimated"),
                    "mlExplain": meta.get("mlExplain"),
                }
            )

        planned_minutes = effective_daily_minutes - capacity
        days.append(
            {
                "date": _to_yyyy_mm_dd(current_date),
                "plannedMinutes": planned_minutes,
                "items": items,
            }
        )

        # safety to avoid infinite loops if estimatedMinutes were 0
        if day_index > 365:
            break

    now = datetime.now(timezone.utc)
    schedule_doc = {
        "userId": inp.user_id,
        "startDate": inp.start_date,
        "dailyStudyMinutes": inp.daily_study_minutes,
        "effectiveDailyStudyMinutes": effective_daily_minutes,
        "days": days,
        "createdAt": now,
        "updatedAt": now,
    }

    result = db.schedules.insert_one(schedule_doc)

    # Return response-friendly schedule
    return {
        "id": str(result.inserted_id),
        "startDate": inp.start_date,
        "dailyStudyMinutes": inp.daily_study_minutes,
        "effectiveDailyStudyMinutes": effective_daily_minutes,
        "days": days,
    }


def get_latest_schedule(user_id: str):
    db = get_db()
    doc = db.schedules.find_one({"userId": user_id}, sort=[("createdAt", -1)])
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "startDate": doc.get("startDate", ""),
        "dailyStudyMinutes": doc.get("dailyStudyMinutes", 0),
        "days": doc.get("days", []),
        "createdAt": doc.get("createdAt"),
    }

