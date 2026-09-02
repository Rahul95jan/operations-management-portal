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
from models.nps import NPSFeedback
from models.resource import Resource
from models.resource_requirement import ResourceRequirement
from models.resource_email_log import ResourceEmailLog
from models.resource_download_log import ResourceDownloadLog
from models.audit_log import AuditLog
from models.app_settings import AppSettings
from models.webinar_participant import WebinarParticipant

# Create all database tables
Base.metadata.create_all(bind=engine)

print("=" * 50)
print("✅ All Tables Created Successfully")
print("=" * 50)
print("Tables Created:")
print(Base.metadata.tables.keys())
print("=" * 50)