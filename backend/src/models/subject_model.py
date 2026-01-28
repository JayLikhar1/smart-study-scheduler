from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class SubjectCreate:
    user_id: str
    name: str

    def to_doc(self):
        now = datetime.now(timezone.utc)
        return {
            "userId": self.user_id,
            "name": self.name.strip(),
            "createdAt": now,
            "updatedAt": now,
        }

