from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from datetime import datetime
from database import Base


class AppSettings(Base):
    """Single-row runtime config table. Read/written live from the Settings page —
    no server restart needed, unlike the .env-only flags it supersedes."""

    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)

    email_notifications_enabled = Column(Boolean, default=True)
    ops_notification_email = Column(String, nullable=True)

    reminder_scheduler_enabled = Column(Boolean, default=False)
    max_reminders_before_final = Column(Integer, default=3)

    resource_default_deadline_hours = Column(Integer, default=24)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
