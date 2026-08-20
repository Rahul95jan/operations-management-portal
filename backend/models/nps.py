from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
from datetime import datetime


class NPSFeedback(Base):
    __tablename__ = "nps_feedback"

    id = Column(Integer, primary_key=True, index=True)

    learner_name = Column(String, nullable=False)

    learner_email = Column(String, unique=True, nullable=False)
    mobile_number = Column(String(15), unique=True, nullable=False)

    course_name = Column(String, nullable=False)
    batch_name = Column(String, nullable=False)
    mentor_name = Column(String, nullable=False)

    instructor_rating = Column(Integer, nullable=False)
    doubt_rating = Column(Integer, nullable=False)
    website_rating = Column(Integer, nullable=False)

    nps_score = Column(Integer, nullable=False)

    feedback = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)