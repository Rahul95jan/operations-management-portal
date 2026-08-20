from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from database import Base


class ResourceEmailLog(Base):
    __tablename__ = "resource_email_logs"

    id = Column(Integer, primary_key=True, index=True)

    resource_requirement_id = Column(Integer, ForeignKey("resource_requirements.id"), nullable=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    mentor_id = Column(Integer, ForeignKey("mentors.id"), nullable=True)

    email = Column(String, nullable=False)
    email_type = Column(String, nullable=False)
    # Initial Resource Request | Reminder | Final Reminder | Submission Confirmation | Operations Notification

    sent_at = Column(DateTime, default=datetime.utcnow)
    reminder_number = Column(Integer, nullable=True)

    status = Column(String, default="Sent")   # Sent | Failed
    error_message = Column(Text, nullable=True)
