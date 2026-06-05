from datetime import datetime
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, Field


class UserDocument(BaseModel):
    """MongoDB document for a Conviction user."""

    id: Optional[str] = Field(default=None, alias="_id")
    google_id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    onboarding_completed: bool = False

    # Future: embedding preferences
    timezone: str = "UTC"

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


# Indexes to create:
# { google_id: 1 } unique
# { email: 1 } unique
INDEXES = [
    {"keys": [("google_id", 1)], "unique": True},
    {"keys": [("email", 1)], "unique": True},
]
