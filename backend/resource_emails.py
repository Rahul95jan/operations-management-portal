import os
from datetime import datetime

PORTAL_URL = os.getenv("PORTAL_URL", "http://localhost:3000")


def _format_dt(value):
    if not value:
        return "Not set"
    return value.strftime("%d %b %Y, %I:%M %p")


def initial_request_email(session, requirements, submission_url=None):
    resource_lines = "\n".join(f"- {r.resource_name}" for r in requirements)
    due_at = next((r.due_at for r in requirements if r.due_at), None)
    link = submission_url or f"{PORTAL_URL}/resources"

    subject = f"Resource Submission Required – {session.topic}"
    body = f"""Hi {session.mentor_name},

Your session "{session.topic}" for {session.batch_name} has been completed.

Please upload/share the required session resources.

Required resources:
{resource_lines}

Deadline:
{_format_dt(due_at)}

Please submit the resources here:
{link}

Regards,
Operations Team
"""
    return subject, body


def reminder_email(session, pending_requirements, submission_url=None, is_final=False):
    pending_lines = "\n".join(f"- {r.resource_name}" for r in pending_requirements)
    due_at = next((r.due_at for r in pending_requirements if r.due_at), None)
    link = submission_url or f"{PORTAL_URL}/resources"

    label = "Reminder: Session Resource Submission Pending"
    if is_final:
        label = "Final Reminder: Session Resource Submission Pending"
    subject = f"{label} – {session.topic}"

    body = f"""Hi {session.mentor_name},

The resource submission for the following session is still pending:

Batch: {session.batch_name}
Session: {session.topic}
Session Date: {session.session_date}

Please submit the required resource at the earliest.

Pending Resources:
{pending_lines}

[Submit Resource]
{link}

Regards,
Operations Team
"""
    return subject, body


def confirmation_email(resource):
    subject = "Thank You for Uploading the Session Resources"
    body = f"""Hi {resource.mentor_name},

Thank you for submitting the resources for:

Batch: {resource.batch_name}
Session: {resource.session_topic}
Session Date: {resource.session_date or "Not set"}

Your resource submission has been successfully recorded.

Regards,
Operations Team
"""
    return subject, body


def ops_notification_email(resource):
    subject = f"New Resource Received – {resource.mentor_name}"
    body = f"""Session:
{resource.session_topic}

Batch:
{resource.batch_name}

Mentor:
{resource.mentor_name}

Resource:
{resource.resource_title}

Received At:
{_format_dt(resource.received_at)}
"""
    return subject, body
