from sqlalchemy import Column, Integer, String
from database import Base

class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    expertise = Column(String)
    linkedin = Column(String)
    hourly_rate = Column(String)
    status = Column(String)