from sqlalchemy import Column, Integer, String
from models.user import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String)
    mentor_name = Column(String)
    batch_name = Column(String)
    session_date = Column(String)
    session_time = Column(String)
    status = Column(String)