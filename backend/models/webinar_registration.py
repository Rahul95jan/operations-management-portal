from sqlalchemy import Column, Integer, String, Boolean, Float
from database import Base


class WebinarRegistration(Base):
    __tablename__ = "webinar_registrations"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(Integer, index=True)

    learner_name = Column(String)
    learner_email = Column(String)
    phone = Column(String)

    registered_at = Column(String)

    attended = Column(Boolean, default=False)
    join_time = Column(String)
    leave_time = Column(String)
    attendance_duration_minutes = Column(Integer, default=0)
