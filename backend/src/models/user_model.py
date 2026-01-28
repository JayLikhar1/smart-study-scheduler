from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class UserCreate:
    name: str
    email: str
    password_hash: str

    def to_doc(self):
        now = datetime.now(timezone.utc)
        return {
            "name": self.name,
            "email": self.email.lower().strip(),
            "passwordHash": self.password_hash,
            "createdAt": now,
            "updatedAt": now,
        }

