from sqlalchemy import Column, Integer, String, Float
from database import Base



class SessionAnalytics(Base):
    __tablename__ = "session_analytics"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(Integer)

    mentor_name = Column(String)

    batch_name = Column(String)

    scheduled_duration = Column(Float)

    actual_duration = Column(Float)

    mentor_join_time = Column(String)

    mentor_leave_time = Column(String)

    first_student_join = Column(String)

    last_student_leave = Column(String)

    registered_count = Column(Integer, default=0)

    joined_count = Column(Integer, default=0)

    unique_attendance = Column(Integer, default=0)

    duplicate_joins = Column(Integer, default=0)

    attendance_percentage = Column(Float, default=0)

    late_joiners = Column(Integer)

    early_leavers = Column(Integer)

    peak_participants = Column(Integer, default=0)

    mentor_total_hours = Column(Float, default=0)

    students_total_hours = Column(Float, default=0)

    poll_count = Column(Integer)

    poll_participants = Column(Integer)

    poll_accuracy = Column(Float, default=0)

    quiz_count = Column(Integer)

    quiz_participants = Column(Integer)

    average_quiz_score = Column(Float)

    chat_messages = Column(Integer)

    private_messages = Column(Integer)

    public_messages = Column(Integer)

    questions_asked = Column(Integer)

    questions_answered = Column(Integer)

    recording_available = Column(String)

    recording_duration = Column(Float)