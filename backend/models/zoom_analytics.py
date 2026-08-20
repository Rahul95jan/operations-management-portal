from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base


class ZoomAnalytics(Base):
    __tablename__ = "zoom_analytics"

    # =====================================================
    # Primary Key
    # =====================================================

    id = Column(Integer, primary_key=True, index=True)

    # =====================================================
    # Webinar Information
    # =====================================================

    session_id = Column(Integer)
    meeting_id = Column(String)
    webinar_title = Column(String)

    project_name = Column(String)
    batch_name = Column(String)
    course_name = Column(String)

    mentor_name = Column(String)
    mentor_email = Column(String)

    session_date = Column(String)
    session_time = Column(String)

    duration = Column(Integer)  # Minutes

    # =====================================================
    # Registration Analytics
    # =====================================================

    registered_learners = Column(Integer, default=0)
    attended_learners = Column(Integer, default=0)

    attendance_rate = Column(Float, default=0)

    no_show_learners = Column(Integer, default=0)
    no_show_rate = Column(Float, default=0)

    peak_concurrent_users = Column(Integer, default=0)

    # =====================================================
    # Watch Time Analytics
    # =====================================================

    average_watch_time = Column(Float, default=0)

    late_joiners = Column(Integer, default=0)
    early_exit_learners = Column(Integer, default=0)

    average_join_time = Column(String)
    average_leave_time = Column(String)

    # =====================================================
    # Chat Analytics
    # =====================================================

    total_chat_messages = Column(Integer, default=0)

    learner_messages = Column(Integer, default=0)

    mentor_messages = Column(Integer, default=0)

    questions_asked = Column(Integer, default=0)

    raised_hands = Column(Integer, default=0)

    emoji_reactions = Column(Integer, default=0)

    # =====================================================
    # Q&A Analytics
    # =====================================================

    questions_answered = Column(Integer, default=0)

    average_response_time = Column(Float, default=0)

    resolved_questions = Column(Integer, default=0)

    open_questions = Column(Integer, default=0)

    # =====================================================
    # Poll Analytics
    # =====================================================

    polls_conducted = Column(Integer, default=0)

    poll_responses = Column(Integer, default=0)

    poll_response_rate = Column(Float, default=0)

    poll_average_rating = Column(Float, default=0)

    highest_rated_poll = Column(Float, default=0)

    # =====================================================
    # Feedback Analytics
    # =====================================================

    feedback_submitted = Column(Integer, default=0)

    session_rating = Column(Float, default=0)

    mentor_rating = Column(Float, default=0)

    content_rating = Column(Float, default=0)

    audio_quality_rating = Column(Float, default=0)

    video_quality_rating = Column(Float, default=0)

    # =====================================================
    # Speaking Analytics
    # =====================================================

    mentor_speaking_minutes = Column(Integer, default=0)

    learner_speaking_minutes = Column(Integer, default=0)

    qa_duration = Column(Integer, default=0)

    discussion_duration = Column(Integer, default=0)

    # =====================================================
    # Recording Analytics
    # =====================================================

    recording_available = Column(Boolean, default=False)

    recording_views = Column(Integer, default=0)

    average_recording_watch_time = Column(Float, default=0)

    recording_completion_rate = Column(Float, default=0)

    # =====================================================
    # AI / Engagement Analytics
    # =====================================================

    engagement_score = Column(Float, default=0)

    webinar_health_score = Column(Float, default=0)

    learner_satisfaction = Column(Float, default=0)

    # =====================================================
    # Operations
    # =====================================================

    platform = Column(String)

    webinar_status = Column(String)

    remarks = Column(String)

    created_at = Column(String)