from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from database import Base


class ResourceRequirement(Base):
    __tablename__ = "resource_requirements"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("mentors.id"), nullable=True)
    mentor_name = Column(String, nullable=True)

    resource_type = Column(String, nullable=False)      # github, notes, pdf, recording, assignment, ...
    resource_category = Column(String, nullable=True)   # session_notes, code_notebook, assignment, ...
    resource_name = Column(String, nullable=False)       # human label, e.g. "GitHub Code"

    is_required = Column(Boolean, default=True)

    due_at = Column(DateTime, nullable=True)
    status = Column(String, default="Pending")
    # Pending | Submitted | Partially Submitted | Complete | Delayed | Overdue | Not Required

    received_at = Column(DateTime, nullable=True)

    # Reminder tracking (per pending requirement — this is what the scheduler checks)
    reminder_count = Column(Integer, default=0)
    last_reminder_sent_at = Column(DateTime, nullable=True)
    next_reminder_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
