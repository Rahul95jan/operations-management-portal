from sqlalchemy import Column, Integer, Float, String, Text, DateTime
from datetime import datetime
from database import Base


class SessionPollSnapshot(Base):
    """One poll snapshot per session from a Zoom poll report import."""

    __tablename__ = "session_poll_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, nullable=False, unique=True, index=True)

    poll_name = Column(String, nullable=True)
    polls_conducted = Column(Integer, default=0)
    poll_responses = Column(Integer, default=0)

    teaching_style_avg = Column(Float, nullable=True)
    doubts_avg = Column(Float, nullable=True)
    effectiveness_avg = Column(Float, nullable=True)
    overall_avg = Column(Float, nullable=True)
    poll_health = Column(String, nullable=True)

    remarks = Column(Text, nullable=True)
    imported_at = Column(DateTime, default=datetime.utcnow)
