from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String)
    photo_path = Column(String)
    phone = Column(String)

    username = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    permissions = Column(JSONB, default=list)   # list of "section.action" strings; SUPER_ADMIN ignores this
    created_at = Column(DateTime, default=datetime.utcnow)
