from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from models.user import Base
from sqlalchemy.sql import func


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_name = Column(String, nullable=False)
    batch_name = Column(String, nullable=False)
    session_date = Column(String, nullable=False)
    session_time = Column(String, nullable=False)
    status = Column(String, default="scheduled")
    zoom_meeting_id = Column(String, nullable=True)
    meeting_link = Column(String, nullable=True)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    poll_results = Column(JSON, nullable=True)
    average_poll_score = Column(Float, nullable=True)
    attendance_count = Column(Integer, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())