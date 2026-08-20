from database import SessionLocal
from models.zoom_analytics import ZoomAnalytics

db = SessionLocal()

# Prevent duplicate data
if db.query(ZoomAnalytics).first():
    print("✅ Zoom Analytics data already exists.")
    db.close()
    exit()

zoom_data = [

    ZoomAnalytics(
        session_id=1,
        meeting_id="987654321",
        webinar_title="LangGraph Introduction",

        project_name="Agentic AI",
        batch_name="GenAI Batch 1",
        course_name="Generative AI Bootcamp",

        mentor_name="Krish Naik",
        mentor_email="krish@gmail.com",

        session_date="2026-07-09",
        session_time="08:00 PM",

        duration=120,

        # Registration
        registered_learners=100,
        attended_learners=92,
        attendance_rate=92.0,
        no_show_learners=8,
        no_show_rate=8.0,
        peak_concurrent_users=88,

        # Watch Time
        average_watch_time=108,
        late_joiners=10,
        early_exit_learners=5,
        average_join_time="08:03 PM",
        average_leave_time="09:56 PM",

        # Chat Analytics
        total_chat_messages=320,
        learner_messages=260,
        mentor_messages=60,
        questions_asked=42,
        raised_hands=18,
        emoji_reactions=145,

        # Q&A Analytics
        questions_answered=39,
        average_response_time=1.8,
        resolved_questions=39,
        open_questions=3,

        # Poll Analytics
        polls_conducted=3,
        poll_responses=85,
        poll_response_rate=92.4,
        poll_average_rating=4.7,
        highest_rated_poll=5.0,

        # Speaking Analytics
        mentor_speaking_minutes=80,
        learner_speaking_minutes=35,
        qa_duration=20,
        discussion_duration=15,

        # Recording Analytics
        recording_available=True,
        recording_views=320,
        average_recording_watch_time=56,
        recording_completion_rate=74,

        # Feedback
        feedback_submitted=76,
        session_rating=4.8,
        mentor_rating=4.9,
        content_rating=4.8,
        audio_quality_rating=4.7,
        video_quality_rating=4.8,

        # AI Metrics
        engagement_score=94,
        webinar_health_score=96,
        learner_satisfaction=4.8,

        platform="Zoom",
        webinar_status="Completed",
        remarks="Excellent engagement",

        created_at="2026-07-09",
    ),

    ZoomAnalytics(
        session_id=2,
        meeting_id="987654322",
        webinar_title="LangChain Advanced",

        project_name="LLMOps",
        batch_name="June Batch",
        course_name="LLMOps Masterclass",

        mentor_name="Raj",
        mentor_email="raj@gmail.com",

        session_date="2026-07-10",
        session_time="08:00 PM",

        duration=150,

        # Registration
        registered_learners=180,
        attended_learners=160,
        attendance_rate=88.9,
        no_show_learners=20,
        no_show_rate=11.1,
        peak_concurrent_users=154,

        # Watch Time
        average_watch_time=132,
        late_joiners=18,
        early_exit_learners=12,
        average_join_time="07:59 PM",
        average_leave_time="10:20 PM",

        # Chat Analytics
        total_chat_messages=450,
        learner_messages=380,
        mentor_messages=70,
        questions_asked=65,
        raised_hands=30,
        emoji_reactions=230,

        # Q&A Analytics
        questions_answered=60,
        average_response_time=1.5,
        resolved_questions=60,
        open_questions=5,

        # Poll Analytics
        polls_conducted=4,
        poll_responses=150,
        poll_response_rate=93.7,
        poll_average_rating=4.9,
        highest_rated_poll=5.0,

        # Speaking Analytics
        mentor_speaking_minutes=95,
        learner_speaking_minutes=48,
        qa_duration=28,
        discussion_duration=22,

        # Recording Analytics
        recording_available=True,
        recording_views=410,
        average_recording_watch_time=68,
        recording_completion_rate=81,

        # Feedback
        feedback_submitted=140,
        session_rating=4.9,
        mentor_rating=4.9,
        content_rating=4.8,
        audio_quality_rating=4.9,
        video_quality_rating=4.9,

        # AI Metrics
        engagement_score=97,
        webinar_health_score=98,
        learner_satisfaction=4.9,

        platform="Zoom",
        webinar_status="Completed",
        remarks="Outstanding webinar",

        created_at="2026-07-10",
    ),
]

db.add_all(zoom_data)
db.commit()
db.close()

print("✅ Zoom Analytics Dummy Data Inserted Successfully")