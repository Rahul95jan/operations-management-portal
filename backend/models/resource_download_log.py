from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from database import Base


class ResourceDownloadLog(Base):
    __tablename__ = "resource_download_logs"

    id = Column(Integer, primary_key=True, index=True)

    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    # nullable together: an "LMS Package" download covers a whole session (no single
    # resource_id), while "Individual"/"Preview" downloads target one resource.

    user_id = Column(String, nullable=True)   # no real auth yet — free-text identifier

    downloaded_at = Column(DateTime, default=datetime.utcnow)
    download_type = Column(String, nullable=False)   # Individual | LMS Package | Preview
