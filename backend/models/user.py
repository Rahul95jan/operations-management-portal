from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, Float, Text


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="mentor")
    hourly_rate = Column(Float, default=0.0)
    google_calendar_token = Column(Text, nullable=True)
    zoom_refresh_token = Column(Text, nullable=True)