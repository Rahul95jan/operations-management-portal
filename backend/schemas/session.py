from pydantic import BaseModel
from typing import Optional


class SessionCreate(BaseModel):
    topic: str
    mentor_id: int
    mentor_name: str
    batch_name: str
    session_date: str
    session_time: str
    status: str = "scheduled"
    meeting_link: Optional[str] = None


class SessionResponse(BaseModel):
    id: int
    topic: str
    mentor_id: int
    mentor_name: str
    batch_name: str
    session_date: str
    session_time: str
    status: str
    meeting_link: Optional[str] = None
    actual_start_time: Optional[str] = None
    actual_end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    average_poll_score: Optional[float] = None
    attendance_count: Optional[int] = None

    class Config:
        from_attributes = True