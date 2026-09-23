import base64
import os
import traceback
from datetime import datetime
from zoneinfo import ZoneInfo

import requests
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_API_URL = "https://api.resend.com/emails"

# Sessions are scheduled in IST (matches AppSettings.reminder_timezone's own default) —
# there's no per-session timezone field, so this is the one place that assumption lives
# for turning a session's date/time into a real calendar event.
SESSION_TZ = ZoneInfo("Asia/Kolkata")
ICS_UID_DOMAIN = "krishnaik-academy-ops-portal"


def _resend_send(to, subject, text=None, html=None, attachments=None):
    """Sends an email through Resend's HTTPS API. This app used to send over raw SMTP,
    but Render's free-tier web services block all outbound traffic to SMTP ports
    (25/465/587) at the network firewall level — confirmed directly from Render's own
    changelog, not something any amount of SMTP-side code could work around. Resend (and
    any other HTTP-API email provider) sends over plain HTTPS, so it isn't affected.
    Never raises: a send failure must never block the request it's attached to."""
    if not RESEND_API_KEY:
        print("⚠️  RESEND_API_KEY not configured — skipping email send.")
        return False
    if not to:
        return False

    payload = {"from": EMAIL_ADDRESS or "onboarding@resend.dev", "to": [to], "subject": subject}
    if text:
        payload["text"] = text
    if html:
        payload["html"] = html
    if attachments:
        payload["attachments"] = attachments

    try:
        resp = requests.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )
        if resp.status_code >= 400:
            print(f"❌ Resend API error {resp.status_code}: {resp.text}")
            return False
        print(f"✅ Email sent via Resend to {to} (id={resp.json().get('id')})")
        return True

    except Exception as e:
        print("\n" + "=" * 70)
        print("❌ EMAIL SENDING FAILED")
        print("ERROR:", str(e))
        traceback.print_exc()
        print("=" * 70 + "\n")
        return False


def send_invoice_email(receiver_email, pdf_path, invoice_number):
    try:
        print("\n" + "=" * 70)
        print("EMAIL CONFIGURATION")
        print("EMAIL_ADDRESS  :", repr(EMAIL_ADDRESS))
        print("RESEND_API_KEY :", "set" if RESEND_API_KEY else "None")
        print("RECEIVER       :", receiver_email)
        print("PDF EXISTS     :", os.path.exists(pdf_path))
        print("PDF PATH       :", pdf_path)
        print("=" * 70)

        with open(pdf_path, "rb") as f:
            pdf_b64 = base64.b64encode(f.read()).decode("ascii")

        return _resend_send(
            receiver_email,
            f"Invoice {invoice_number}",
            text=(
                f"Hello,\n\n"
                f"Please find your invoice attached.\n\n"
                f"Invoice Number: {invoice_number}\n\n"
                f"Thank you.\n\n"
                f"Regards,\nKrish Naik Academy Team"
            ),
            attachments=[{
                "filename": os.path.basename(pdf_path),
                "content": pdf_b64,
                "content_type": "application/pdf",
            }],
        )

    except Exception as e:
        print("\n" + "=" * 70)
        print("❌ EMAIL SENDING FAILED")
        print("ERROR:", str(e))
        traceback.print_exc()
        print("=" * 70 + "\n")
        return False


def send_session_notification(receiver_email, subject, body):
    """Generic plain-text notifier for session scheduled/rescheduled/cancelled events.
    Returns False (never raises) if Resend isn't configured or sending fails, so a
    session create/update/delete never gets blocked by a notification problem."""
    if not receiver_email:
        print("⚠️  Skipping session notification — mentor has no email on file.")
        return False

    return _resend_send(receiver_email, subject, text=body)


def _ics_escape(text):
    """Escapes TEXT-value special characters per RFC 5545 (backslash, semicolon, comma,
    newline) — anything going into SUMMARY/DESCRIPTION/LOCATION needs this."""
    if not text:
        return ""
    return (
        str(text)
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def _ics_fold(line):
    """RFC 5545 requires content lines to be folded at 75 octets, with each continuation
    line starting with a single space."""
    if len(line) <= 75:
        return line
    parts = [line[:75]]
    rest = line[75:]
    while rest:
        parts.append(" " + rest[:74])
        rest = rest[74:]
    return "\r\n".join(parts)


def build_session_ics(session_id, sequence, method, summary, description, start_dt, end_dt, organizer_email, attendee_email, location=None, status="CONFIRMED"):
    """Builds an iCalendar (.ics) invite for a session so it becomes a real event on the
    mentor's own calendar app (Gmail/Outlook/Apple) — not just an internal Ops Portal
    record. Uses the same UID across the Scheduled/Rescheduled/Cancelled emails for one
    session, with a monotonically increasing SEQUENCE (the caller passes the current unix
    timestamp — always greater than whatever was sent before), so calendar apps treat a
    later email as an update to the same event instead of a duplicate invite."""
    uid = f"session-{session_id}@{ICS_UID_DOMAIN}"
    now_utc = datetime.now(ZoneInfo("UTC"))

    def fmt(dt):
        return dt.astimezone(ZoneInfo("UTC")).strftime("%Y%m%dT%H%M%SZ")

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Krish Naik Academy//Operations Portal//EN",
        f"METHOD:{method}",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{fmt(now_utc)}",
        f"DTSTART:{fmt(start_dt)}",
        f"DTEND:{fmt(end_dt)}",
        f"SEQUENCE:{sequence}",
        f"STATUS:{status}",
        f"SUMMARY:{_ics_escape(summary)}",
        f"DESCRIPTION:{_ics_escape(description)}",
        f"ORGANIZER:mailto:{organizer_email}",
        f"ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:{attendee_email}",
    ]
    if location:
        lines.append(f"LOCATION:{_ics_escape(location)}")
    lines += ["END:VEVENT", "END:VCALENDAR"]

    return "\r\n".join(_ics_fold(line) for line in lines) + "\r\n"


def send_session_calendar_invite(receiver_email, subject, body, ics_content, method="REQUEST"):
    """Sends the session notification email with a proper calendar invite (.ics) attached
    (Content-Type: text/calendar; method=...), so the mentor's calendar app shows it as a
    real event with Yes/No/Maybe instead of just a plain-text notice. Same never-raises
    contract as send_session_notification — a notification/invite failure must never block
    the session CRUD it's attached to."""
    if not receiver_email:
        print("⚠️  Skipping calendar invite — mentor has no email on file.")
        return False

    ics_b64 = base64.b64encode(ics_content.encode("utf-8")).decode("ascii")

    return _resend_send(
        receiver_email,
        subject,
        text=body,
        attachments=[{
            "filename": "invite.ics",
            "content": ics_b64,
            "content_type": f"text/calendar; method={method}; charset=UTF-8",
        }],
    )


def send_email(receiver_email, subject, body):
    """Generic plain-text sender. Returns (success: bool, error_message: str | None)
    instead of raising, so callers can log the outcome without their own business logic
    failing on a send error."""
    if not RESEND_API_KEY:
        return False, "RESEND_API_KEY not configured"

    try:
        resp = requests.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": EMAIL_ADDRESS or "onboarding@resend.dev", "to": [receiver_email], "subject": subject, "text": body},
            timeout=30,
        )
        if resp.status_code >= 400:
            return False, resp.text
        return True, None

    except Exception as e:
        print("send_email failed:", e)
        return False, str(e)
