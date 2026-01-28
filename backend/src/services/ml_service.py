"""
Phase 8: ML service — explainable, simple models.

- Linear Regression: predict actual study time from estimatedMinutes, difficulty, subject history.
- K-Means: cluster productivity patterns (minutes, day-of-week) for insights.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import numpy as np
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression

from src.db.mongo import get_db

DIFFICULTY_ENCODING = {"low": 1, "medium": 2, "high": 3}
MIN_SAMPLES_LR = 5
MIN_SAMPLES_KMEANS = 4
N_CLUSTERS = 3


def _iso(d: date) -> str:
    return d.isoformat()


def _day_of_week(s: str) -> int:
    try:
        return date.fromisoformat(s).weekday()  # 0=Mon, 6=Sun
    except Exception:
        return 0


def _subject_avg(events: list, subject_id: str) -> float:
    mins = [int(e.get("minutes") or 0) for e in events if e.get("subjectId") == subject_id and e.get("outcome") == "done"]
    return float(np.mean(mins)) if mins else 0.0


def get_predicted_minutes(task_doc: dict, user_id: str) -> tuple[int | None, str | None]:
    """
    Linear Regression prediction for how long this task will realistically take.
    Returns (predicted_minutes, explain_str) or (None, None) if not enough data.
    """
    db = get_db()
    events = list(
        db.task_events.find(
            {"userId": user_id, "outcome": "done"},
            {"estimatedMinutes": 1, "difficulty": 1, "subjectId": 1, "minutes": 1},
        )
    )

    # Need estimatedMinutes and minutes for training; skip events missing them
    samples = []
    for e in events:
        est = e.get("estimatedMinutes")
        actual = e.get("minutes")
        if est is None or actual is None:
            continue
        try:
            est = int(est)
            actual = int(actual)
        except (TypeError, ValueError):
            continue
        if est <= 0:
            continue
        diff = (e.get("difficulty") or "medium").lower()
        diff_enc = DIFFICULTY_ENCODING.get(diff, 2)
        subj = e.get("subjectId") or ""
        subj_avg = _subject_avg(events, subj) if subj else 0.0
        if subj_avg == 0 and subj:
            subj_avg = float(actual)  # fallback to self for singleton
        samples.append((est, diff_enc, subj_avg, actual))

    if len(samples) < MIN_SAMPLES_LR:
        return None, None

    X = np.array([[s[0], s[1], s[2]] for s in samples], dtype=float)
    y = np.array([s[3] for s in samples], dtype=float)

    model = LinearRegression()
    model.fit(X, y)

    est = int(task_doc.get("estimatedMinutes") or 0)
    if est <= 0:
        return None, None
    diff = (task_doc.get("difficulty") or "medium").lower()
    diff_enc = DIFFICULTY_ENCODING.get(diff, 2)
    subj = task_doc.get("subjectId") or ""
    subj_avg = _subject_avg(events, subj) if subj else 0.0
    if subj_avg == 0:
        subj_avg = float(est)

    x = np.array([[est, diff_enc, subj_avg]], dtype=float)
    pred = float(model.predict(x)[0])
    pred = max(1, min(600, round(pred)))  # clamp 1–600 min

    ratio = pred / est if est else 1.0
    explain = (
        f"ML prediction from {len(samples)} past sessions: "
        f"estimated {est} min, difficulty {diff} → predicted {pred} min "
        f"({ratio:.0%} of estimate)."
    )
    return pred, explain


def get_productivity_patterns(user_id: str) -> dict:
    """
    K-Means on (minutes, day_of_week) from done task_events.
    Returns cluster centers and human-readable explanations.
    """
    db = get_db()
    events = list(
        db.task_events.find(
            {"userId": user_id, "outcome": "done"},
            {"minutes": 1, "scheduledDate": 1},
        )
    )

    rows = []
    for e in events:
        m = e.get("minutes")
        d = e.get("scheduledDate")
        if m is None or not d:
            continue
        try:
            m = int(m)
        except (TypeError, ValueError):
            continue
        if m <= 0:
            continue
        rows.append([float(m), float(_day_of_week(d))])

    if len(rows) < MIN_SAMPLES_KMEANS:
        return {
            "ready": False,
            "explain": "Need at least 4 completed study sessions to detect productivity patterns.",
            "clusters": [],
            "nSamples": len(rows),
        }

    X = np.array(rows)
    k = min(N_CLUSTERS, max(2, len(rows) // 2))
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X)

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    clusters = []
    for i in range(k):
        c = km.cluster_centers_[i]
        avg_min = int(round(c[0]))
        dow = int(round(c[1])) % 7
        clusters.append({
            "id": i,
            "avgMinutes": avg_min,
            "typicalDay": day_names[dow],
            "label": f"~{avg_min} min, often {day_names[dow]}",
        })

    # Sort by avg minutes ascending for a consistent “light / medium / heavy” ordering
    clusters.sort(key=lambda x: x["avgMinutes"])

    explain = (
        f"From {len(rows)} sessions, we found {k} patterns: "
        + "; ".join(c["label"] for c in clusters)
        + "."
    )

    return {
        "ready": True,
        "explain": explain,
        "clusters": clusters,
        "nSamples": len(rows),
    }
