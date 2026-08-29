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

    # Reminder cadence/window — the real per-requirement resend interval and the
    # hours-of-day automatic reminders are allowed to fire in (manual "Send
    # Reminder" always bypasses this). See resource_scheduling.py.
    reminder_interval_hours = Column(Float, default=2.0)
    reminder_window_start_hour = Column(Integer, default=10)
    reminder_window_end_hour = Column(Integer, default=14)
    reminder_timezone = Column(String, default="Asia/Kolkata")

    # Saturday/Sunday sessions get a due date on the following Monday instead
    # of the flat resource_default_deadline_hours offset.
    weekend_deadline_enabled = Column(Boolean, default=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
