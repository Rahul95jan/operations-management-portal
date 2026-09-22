from sqlalchemy import text

from database import Base, engine

# Import all models
from models.user import User
from models.mentor import Mentor
from models.batch import Batch
from models.session import Session
from models.invoice import Invoice
from models.session_analytics import SessionAnalytics
from models.operations import OperationsAnalytics
from models.zoom_analytics import ZoomAnalytics
from models.webinar_registration import WebinarRegistration
from models.nps import NPSFeedback
from models.resource import Resource
from models.resource_requirement import ResourceRequirement
from models.resource_email_log import ResourceEmailLog
from models.resource_download_log import ResourceDownloadLog
from models.audit_log import AuditLog
from models.app_settings import AppSettings
from models.webinar_participant import WebinarParticipant
from models.session_report import SessionReport
from models.session_attendance import SessionAttendance

# Create all database tables
Base.metadata.create_all(bind=engine)

# `create_all` creates new tables, but it does not add columns to an existing
# database. These fields were introduced with the portal's authentication
# system, so upgrade databases created by older versions before login is used.
with engine.begin() as connection:
    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR"))
    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR"))
    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE"))
    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb"))
    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)"))

print("=" * 50)
print("✅ All Tables Created Successfully")
print("=" * 50)
print("Tables Created:")
print(Base.metadata.tables.keys())
print("=" * 50)
