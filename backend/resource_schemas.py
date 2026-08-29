from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# =====================================================
# Resource (submitted item)
# =====================================================

class ResourceCreate(BaseModel):
    session_id: Optional[int] = None
    mentor_id: Optional[int] = None
    mentor_name: Optional[str] = None
    batch_name: Optional[str] = None
    course_name: Optional[str] = None
    session_topic: Optional[str] = None
    session_date: Optional[str] = None

    resource_type: str
    resource_category: Optional[str] = None
    resource_title: str
    resource_url: Optional[str] = None
    description: Optional[str] = None

    is_required: Optional[bool] = True
    created_by: Optional[str] = None


class ResourceUpdate(BaseModel):
    resource_title: Optional[str] = None
    resource_url: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    updated_by: Optional[str] = None


# =====================================================
# Resource Requirement (what's required for a session)
# =====================================================

class ResourceRequirementItem(BaseModel):
    resource_type: str
    resource_category: Optional[str] = None
    resource_name: str
    is_required: Optional[bool] = True


class ResourceRequirementCreate(BaseModel):
    session_id: int
    mentor_id: Optional[int] = None
    mentor_name: Optional[str] = None
    due_at: Optional[datetime] = None
    requirements: list[ResourceRequirementItem]


class ResourceRequirementStatusUpdate(BaseModel):
    status: str          # Pending | Submitted | Partially Submitted | Complete | Delayed | Overdue | Not Required


# =====================================================
# App Settings
# =====================================================

class AppSettingsUpdate(BaseModel):
    email_notifications_enabled: Optional[bool] = None
    ops_notification_email: Optional[str] = None
    reminder_scheduler_enabled: Optional[bool] = None
    max_reminders_before_final: Optional[int] = None
    resource_default_deadline_hours: Optional[int] = None
    reminder_interval_hours: Optional[float] = None
    reminder_window_start_hour: Optional[int] = None
    reminder_window_end_hour: Optional[int] = None
    reminder_timezone: Optional[str] = None
    weekend_deadline_enabled: Optional[bool] = None
    updated_by: Optional[str] = None
