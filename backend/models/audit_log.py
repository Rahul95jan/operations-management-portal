from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    user = Column(String, nullable=True)          # no real auth yet — "system" / "Operations" / mentor name
    action = Column(String, nullable=False)
    # Resource Created | Resource Updated | Resource Deleted | Requirement Created |
    # Requirement Completed | Reminder Sent | Email Failed | Requirement Closed

    resource_id = Column(Integer, nullable=True)
    session_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
