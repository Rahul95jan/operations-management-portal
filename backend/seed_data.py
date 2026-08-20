from database import SessionLocal
from models.user import User
from models.mentor import Mentor
from models.batch import Batch
from models.session import Session

db = SessionLocal()

# ----------------------------
# USER
# ----------------------------
user = db.query(User).filter(
    User.email == "rahul@gmail.com"
).first()

if not user:
    user = User(
        name="Rahul Kumar",
        email="rahul@gmail.com"
    )
    db.add(user)

# ----------------------------
# MENTOR
# ----------------------------
mentor = db.query(Mentor).filter(
    Mentor.email == "krish@gmail.com"
).first()

if not mentor:
    mentor = Mentor(
        name="Krish Naik",
        email="krish@gmail.com",
        phone="9876543210",
        expertise="Generative AI",
        linkedin="https://linkedin.com/in/krishnaik",
        hourly_rate=5000,
    )
    db.add(mentor)

# ----------------------------
# BATCH
# ----------------------------
batch = db.query(Batch).filter(
    Batch.batch_name == "GenAI Batch 1"
).first()

if not batch:
    batch = Batch(
        batch_name="GenAI Batch 1",
        course_name="Generative AI",
        strength=100,
        mentor_name="Krish Naik",
    )
    db.add(batch)

# ----------------------------
# SESSION
# ----------------------------
existing_session = db.query(Session).filter(
    Session.topic == "LangGraph Introduction"
).first()

if not existing_session:

    session = Session(
        project_name="Operations Management Portal",
        category="GenAI",

        topic="LangGraph Introduction",

        batch_name="GenAI Batch 1",
        course_name="Generative AI",
        strength=100,

        mentor_name="Krish Naik",
        mentor_email="krish@gmail.com",

        session_date="2026-07-01",
        session_time="08:00 PM",
        duration=120,

        platform="Zoom",
        meeting_link="https://zoom.us/j/123456789",
        recording_link="",

        status="Scheduled",

        registered_students=100,
        attended_students=92,
        attendance_percentage=92,

        feedback_score=4.8,

        assignment_given="LangGraph Assignment",
        assignment_completed=85,

        created_by="Rahul Kumar",

        remarks="First Live Session"
    )

    db.add(session)

# ----------------------------
# SAVE
# ----------------------------
db.commit()
db.close()

print("===================================")
print(" Dummy Data Inserted Successfully ")
print("===================================")