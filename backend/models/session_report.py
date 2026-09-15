from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from database import Base


class SessionReport(Base):
    """The operational/ops report for one live session — narrative content
    plus review status. One row per session_id (plain int, no FK — same
    convention as Resource.session_id / SessionAnalytics.session_id
    elsewhere in this codebase)."""

    __tablename__ = "session_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, nullable=False, unique=True, index=True)

    # Session Content (also surfaced on the report section of the same page)
    agenda = Column(Text, nullable=True)
    learning_objectives = Column(Text, nullable=True)
    topics_covered = Column(Text, nullable=True)
    lms_content_link = Column(String, nullable=True)
    presentation_link = Column(String, nullable=True)
    assignment_link = Column(String, nullable=True)

    # Session Report
    summary = Column(Text, nullable=True)
    learner_questions = Column(Text, nullable=True)
    discussion_points = Column(Text, nullable=True)
    issues_faced = Column(Text, nullable=True)
    technical_issues = Column(Text, nullable=True)
    learner_engagement = Column(Text, nullable=True)
    mentor_feedback = Column(Text, nullable=True)
    operations_notes = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(String, nullable=True)

    report_status = Column(String, default="Pending")  # Pending | Submitted | Reviewed
    reviewed_by = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
