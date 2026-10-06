from sqlalchemy import Column, Integer, Float, Boolean, DateTime, String
from datetime import datetime
from database import Base


class SessionAttendanceImport(Base):
    """Zoom attendee-report summary metrics for one session import."""

    __tablename__ = "session_attendance_import"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, nullable=False, unique=True, index=True)

    unique_viewers = Column(Integer, nullable=True)
    total_users = Column(Integer, nullable=True)
    max_concurrent_views = Column(Integer, nullable=True)
    actual_duration_minutes = Column(Integer, nullable=True)
    hold_rate = Column(Float, nullable=True)

    median_stay_minutes = Column(Float, nullable=True)
    pct_stayed_half = Column(Float, nullable=True)
    pct_stayed_three_quarter = Column(Float, nullable=True)
    pct_under_15_min = Column(Float, nullable=True)

    has_registrant_total = Column(Boolean, default=False)
    registrant_total = Column(Integer, nullable=True)

    previous_attended_students = Column(Integer, nullable=True)
    previous_registered_students = Column(Integer, nullable=True)
    previous_attendance_percentage = Column(Float, nullable=True)

    imported_at = Column(DateTime, default=datetime.utcnow)
