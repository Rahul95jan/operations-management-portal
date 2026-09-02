from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from datetime import datetime
from database import Base


class WebinarParticipant(Base):
    """One row per registrant/attendee of a webinar (ZoomAnalytics row).
    No FK — same plain-int convention as the rest of this codebase.

    There is no Learner/User directory table anywhere in this app, so
    is_existing_user is a best-effort heuristic: true if this email has
    appeared before, either as NPS feedback (a proxy for "has taken a
    course") or as a participant on an earlier webinar — not a real
    enrollment/CRM check, because that data doesn't exist in this database."""

    __tablename__ = "webinar_participants"

    id = Column(Integer, primary_key=True, index=True)

    webinar_id = Column(Integer, nullable=False, index=True)  # -> ZoomAnalytics.id

    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)

    registration_date = Column(DateTime, default=datetime.utcnow)

    attended = Column(Boolean, default=False)
    attendance_duration = Column(Integer, nullable=True)  # minutes
    attendance_percentage = Column(Float, nullable=True)

    rating = Column(Integer, nullable=True)  # 1-5
    feedback = Column(Text, nullable=True)

    source = Column(String, nullable=True)  # e.g. "organic", "referral", "ads"

    is_unique_user = Column(Boolean, default=True)
    is_existing_user = Column(Boolean, default=False)

    course_interest = Column(String, nullable=True)
    lead_status = Column(String, default="New")
    # New | Interested | Follow-up Required | Contacted | Qualified | Converted | Not Interested | Not Reachable

    sales_followup_status = Column(String, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
