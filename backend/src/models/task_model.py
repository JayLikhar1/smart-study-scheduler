from dataclasses import dataclass
from datetime import datetime, timezone

ALLOWED_DIFFICULTY = {"low", "medium", "high"}
ALLOWED_STATUS = {"pending", "done", "missed"}


@dataclass
class TaskCreate:
    user_id: str
    subject_id: str
    topic: str
    difficulty: str
    estimated_minutes: int
    deadline: str  # YYYY-MM-DD (kept simple for MVP)

    def to_doc(self):
        now = datetime.now(timezone.utc)
        return {
            "userId": self.user_id,
            "subjectId": self.subject_id,
            "topic": self.topic.strip(),
            "difficulty": self.difficulty,
            "estimatedMinutes": self.estimated_minutes,
            "deadline": self.deadline,
            "status": "pending",
            "missedCount": 0,
            "createdAt": now,
            "updatedAt": now,
        }

