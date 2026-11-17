from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MyResume(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    original_filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime


class SkillSuggestion(BaseModel):
    name: str
    mentions: int


class SkillSuggestions(BaseModel):
    suggestions: list[SkillSuggestion]
    # How much text could be read from the resume; 0 usually means a scanned image.
    characters_read: int