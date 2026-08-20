from sqlalchemy import Column, Integer, String, Float
from models.user import Base
from database import Base

active_learners = Column(Integer, default=0)

inactive_learners = Column(Integer, default=0)

course_completion = Column(Float, default=0)

dropout_count = Column(Integer, default=0)


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_name = Column(String)
    course_name = Column(String)
    strength = Column(Integer)
    mentor_name = Column(String)

    status = Column(String)
    attendance_percentage = Column(Float, default=0)
    completion_percentage = Column(Float, default=0)
    health_score = Column(Float, default=0)

    active_learners = Column(Integer, default=0)
    inactive_learners = Column(Integer, default=0)
    course_completion = Column(Float, default=0)
    dropout_count = Column(Integer, default=0)