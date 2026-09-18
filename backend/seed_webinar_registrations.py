from database import SessionLocal
from models.webinar_registration import WebinarRegistration

db = SessionLocal()

# Prevent duplicate data
if db.query(WebinarRegistration).first():
    print("✅ Webinar Registrations data already exists.")
    db.close()
    exit()

session_1_learners = [
    ("Aarav Sharma", "aarav.sharma@example.com", True, "07:58 PM", "10:00 PM", 122),
    ("Priya Patel", "priya.patel@example.com", True, "08:00 PM", "10:00 PM", 120),
    ("Rohan Mehta", "rohan.mehta@example.com", True, "08:02 PM", "09:45 PM", 103),
    ("Sneha Iyer", "sneha.iyer@example.com", True, "07:59 PM", "10:00 PM", 121),
    ("Vikram Singh", "vikram.singh@example.com", False, None, None, 0),
    ("Ananya Rao", "ananya.rao@example.com", True, "08:05 PM", "09:50 PM", 105),
    ("Karan Gupta", "karan.gupta@example.com", True, "08:00 PM", "08:40 PM", 40),
    ("Divya Nair", "divya.nair@example.com", True, "08:01 PM", "10:00 PM", 119),
    ("Arjun Desai", "arjun.desai@example.com", False, None, None, 0),
    ("Kavya Reddy", "kavya.reddy@example.com", True, "07:57 PM", "10:00 PM", 123),
]

session_2_learners = [
    ("Ishaan Kapoor", "ishaan.kapoor@example.com", True, "10:00 AM", "12:00 PM", 120),
    ("Meera Joshi", "meera.joshi@example.com", True, "10:01 AM", "12:00 PM", 119),
    ("Aditya Verma", "aditya.verma@example.com", True, "10:03 AM", "11:30 AM", 87),
    ("Nisha Agarwal", "nisha.agarwal@example.com", True, "10:00 AM", "12:00 PM", 120),
    ("Rahul Bose", "rahul.bose@example.com", False, None, None, 0),
    ("Tanvi Malhotra", "tanvi.malhotra@example.com", True, "10:05 AM", "11:50 AM", 105),
    ("Yash Chowdhury", "yash.chowdhury@example.com", True, "10:00 AM", "12:00 PM", 120),
    ("Riya Bhatt", "riya.bhatt@example.com", True, "10:02 AM", "10:45 AM", 43),
    ("Siddharth Menon", "siddharth.menon@example.com", False, None, None, 0),
    ("Pooja Krishnan", "pooja.krishnan@example.com", True, "09:58 AM", "12:00 PM", 122),
]

registrations = []

for name, email, attended, join_time, leave_time, duration in session_1_learners:
    registrations.append(
        WebinarRegistration(
            session_id=1,
            learner_name=name,
            learner_email=email,
            registered_at="2026-07-05",
            attended=attended,
            join_time=join_time,
            leave_time=leave_time,
            attendance_duration_minutes=duration,
        )
    )

for name, email, attended, join_time, leave_time, duration in session_2_learners:
    registrations.append(
        WebinarRegistration(
            session_id=2,
            learner_name=name,
            learner_email=email,
            registered_at="2026-07-06",
            attended=attended,
            join_time=join_time,
            leave_time=leave_time,
            attendance_duration_minutes=duration,
        )
    )

db.add_all(registrations)
db.commit()
db.close()

print("=" * 50)
print(f"✅ Seeded {len(registrations)} Webinar Registrations")
print("=" * 50)
