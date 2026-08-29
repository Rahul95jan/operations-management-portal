from sqlalchemy import Column, Integer, String, Float
from database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)

    # Project Details
    project_name = Column(String, nullable=False)
    category = Column(String)
    topic = Column(String)

    # Batch Details
    batch_name = Column(String)
    course_name = Column(String)
    strength = Column(Integer)

    # Mentor Details
    mentor_name = Column(String)
    mentor_email = Column(String)

    # Session Schedule
    session_date = Column(String)
    session_time = Column(String)
    duration = Column(Integer)          # Minutes

    # Meeting Details
    platform = Column(String)           # Zoom / Google Meet
    meeting_link = Column(String)
    recording_link = Column(String)

    # Status
    status = Column(String)             # Scheduled, Completed, Cancelled

    # Attendance
    registered_students = Column(Integer, default=0)
    attended_students = Column(Integer, default=0)
    attendance_percentage = Column(Float, default=0)

    # Feedback
    feedback_score = Column(Float, default=0)

    # Session Metrics
    assignment_given = Column(String)
    assignment_completed = Column(Integer, default=0)

    # Operations
    created_by = Column(String)
    remarks = Column(String)

    # Resource Portal — stable, unguessable link so a mentor can submit this
    # session's resources with no login (see resource_tokens.py)
    resource_access_token = Column(String, unique=True, nullable=True, index=True)