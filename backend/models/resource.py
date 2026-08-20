from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from datetime import datetime
from database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)

    # Session / Mentor context
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    mentor_id = Column(Integer, ForeignKey("mentors.id"), nullable=True)
    mentor_name = Column(String, nullable=True)

    batch_name = Column(String, nullable=True)
    course_name = Column(String, nullable=True)
    session_topic = Column(String, nullable=True)

    # Resource details
    resource_type = Column(String, nullable=False)     # github, notion, google_drive, pdf, ppt, ...
    resource_title = Column(String, nullable=False)
    resource_url = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)          # bytes
    mime_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    # Timing
    submitted_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    status = Column(String, default="Submitted")
    is_required = Column(Boolean, default=True)

    due_at = Column(DateTime, nullable=True)
    received_at = Column(DateTime, nullable=True)
    delay_minutes = Column(Integer, nullable=True)
    delay_hours = Column(Float, nullable=True)

    reminder_count = Column(Integer, default=0)
    last_reminder_sent_at = Column(DateTime, nullable=True)
    next_reminder_at = Column(DateTime, nullable=True)

    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
