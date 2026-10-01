from sqlalchemy import Column, Integer, String, LargeBinary
from sqlalchemy.orm import deferred
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
    photo_path = Column(String)
    # Photo bytes live in the DB because the server disk is wiped on every
    # deploy. Deferred so GET /mentors (which returns ORM rows) never loads
    # or serializes them.
    photo_data = deferred(Column(LargeBinary))
    photo_mime = deferred(Column(String))