import os
from datetime import datetime

PORTAL_URL = os.getenv("PORTAL_URL", "http://localhost:3000")


def _format_dt(value):
    if not value:
        return "Not set"
    return value.strftime("%d %b %Y, %I:%M %p")


def initial_request_email(session, requirements):
    resource_lines = "\n".join(f"- {r.resource_name}" for r in requirements)
    due_at = next((r.due_at for r in requirements if r.due_at), None)

    subject = f"Resource Submission Required – {session.topic}"
    body = f"""Hi {session.mentor_name},

Your session "{session.topic}" for {session.batch_name} has been completed.

Please upload/share the required session resources.

Required resources:
{resource_lines}

Deadline:
{_format_dt(due_at)}

Please submit the resources through the Operations Management Portal:
{PORTAL_URL}/resources

Regards,
Operations Team
"""
    return subject, body


def reminder_email(session, pending_requirements, is_final=False):
    pending_lines = "\n".join(f"- {r.resource_name}" for r in pending_requirements)
    due_at = next((r.due_at for r in pending_requirements if r.due_at), None)

    delay_text = "Not yet overdue"
    if due_at:
        delay_hours = max(0, round((datetime.utcnow() - due_at).total_seconds() / 3600, 1))
        delay_text = f"{delay_hours} hours" if delay_hours > 0 else "Due now"

    label = "Final Reminder" if is_final else "Reminder"
    subject = f"{label}: Resource Submission Pending – {session.topic}"

    body = f"""Hi {session.mentor_name},

This is a reminder that the resources for:

Session:
{session.topic}

Batch:
{session.batch_name}

Session Date:
{session.session_date}

are still pending.

Please upload/share the required resources as soon as possible.

Pending Resources:
{pending_lines}

Original Deadline:
{_format_dt(due_at)}

Current Delay:
{delay_text}

Please complete the submission at the earliest:
{PORTAL_URL}/resources

Regards,
Operations Team
"""
    return subject, body


def confirmation_email(resource):
    subject = f"Resource Received – {resource.session_topic or resource.resource_title}"
    body = f"""Hi {resource.mentor_name},

We have successfully received your resource submission for:

{resource.session_topic or resource.resource_title}

Submitted At:
{_format_dt(resource.submitted_at)}

Resource:
{resource.resource_title}

Thank you.

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
