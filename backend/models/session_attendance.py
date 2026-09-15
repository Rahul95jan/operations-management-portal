from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base


class SessionAttendance(Base):
    """One row per learner's attendance record for a live session. Plain-int
    session_id, no FK — same convention as Resource.session_id elsewhere."""

    __tablename__ = "session_attendance"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, nullable=False, index=True)

    learner_name = Column(String, nullable=False)
    learner_email = Column(String, nullable=True)

    join_time = Column(String, nullable=True)
    leave_time = Column(String, nullable=True)
    duration_minutes = Column(Float, nullable=True)

    attendance_status = Column(String, default="Present")  # Present | Absent | Late

    created_at = Column(DateTime, default=datetime.utcnow)
