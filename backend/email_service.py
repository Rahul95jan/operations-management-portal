import os
import smtplib
import socket
import time
import traceback
from datetime import datetime
from email.message import EmailMessage
from zoneinfo import ZoneInfo
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

# Sessions are scheduled in IST (matches AppSettings.reminder_timezone's own default) —
# there's no per-session timezone field, so this is the one place that assumption lives
# for turning a session's date/time into a real calendar event.
SESSION_TZ = ZoneInfo("Asia/Kolkata")
ICS_UID_DOMAIN = "krishnaik-academy-ops-portal"


def _smtp_connect_ipv4(host, port, timeout=30):
    """This machine's route to an SMTP host's IPv6 address is unreachable (mail hosts
    like smtp.gmail.com publish both A and AAAA records, and Python prefers IPv6 when
    it's advertised) — a plain smtplib.SMTP(host, port) fails immediately with
    'Network is unreachable'. Same gap database.py's _connect() already works around for
    the Postgres connection; this is the SMTP equivalent — connect by IPv4 address, but
    keep the real hostname on the SMTP object so STARTTLS still validates the server's
    certificate against the actual domain, not a raw IP."""
    ipv4 = socket.getaddrinfo(host, port, socket.AF_INET)[0][4][0]
    smtp = smtplib.SMTP(timeout=timeout)
    smtp.connect(ipv4, port)
    smtp._host = host  # noqa: SLF001 — starttls() reads this for the TLS SNI/cert hostname check
    return smtp


def send_invoice_email(receiver_email, pdf_path, invoice_number):
    try:
        print("\n" + "=" * 70)
        print("EMAIL CONFIGURATION")
        print("EMAIL_ADDRESS :", repr(EMAIL_ADDRESS))
        print("EMAIL_PASSWORD:", "*" * len(EMAIL_PASSWORD) if EMAIL_PASSWORD else "None")
        print("SMTP_SERVER   :", SMTP_SERVER)
        print("SMTP_PORT     :", SMTP_PORT)
        print("RECEIVER      :", receiver_email)
        print("PDF EXISTS    :", os.path.exists(pdf_path))
        print("PDF PATH      :", pdf_path)
        print("=" * 70)

        msg = EmailMessage()
        msg["Subject"] = f"Invoice {invoice_number}"
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = receiver_email

        msg.set_content(f"""
Hello,

Please find your invoice attached.

Invoice Number: {invoice_number}

Thank you.

Regards,
Krish Naik Academy Team
""")

        with open(pdf_path, "rb") as f:
            msg.add_attachment(
                f.read(),
                maintype="application",
                subtype="pdf",
                filename=os.path.basename(pdf_path),
            )

        print("Connecting to Gmail SMTP...")

        with _smtp_connect_ipv4(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.set_debuglevel(1)

            smtp.ehlo()

            print("Starting TLS...")
            smtp.starttls()

            smtp.ehlo()

            print("Logging in...")
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)

            print("Sending email...")
            smtp.send_message(msg)

        print("✅ Email sent successfully")

        return True

    except Exception as e:
        print("\n" + "=" * 70)
        print("❌ EMAIL SENDING FAILED")
        print("ERROR:", str(e))
        traceback.print_exc()
        print("=" * 70 + "\n")

        return False


def send_session_notification(receiver_email, subject, body):
    """Generic plain-text notifier for session scheduled/rescheduled/cancelled events —
    reuses the same SMTP config as invoice emails. Returns False (never raises) if SMTP
    isn't configured yet or sending fails, so a session create/update/delete never gets
    blocked by a notification problem."""
    if not receiver_email:
        print("⚠️  Skipping session notification — mentor has no email on file.")
        return False

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = receiver_email
        msg.set_content(body)

        with _smtp_connect_ipv4(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)

        print(f"✅ Session notification sent to {receiver_email}")
        return True

    except Exception as e:
        print("\n" + "=" * 70)
        print("❌ SESSION NOTIFICATION FAILED")
        print("ERROR:", str(e))
        traceback.print_exc()
        print("=" * 70 + "\n")
        return False


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

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = receiver_email
        msg.set_content(body)

        msg.add_attachment(
            ics_content.encode("utf-8"),
            maintype="text",
            subtype="calendar",
            filename="invite.ics",
            params={"method": method, "name": "invite.ics"},
        )

        with _smtp_connect_ipv4(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)

        print(f"✅ Calendar invite ({method}) sent to {receiver_email}")
        return True

    except Exception as e:
        print("\n" + "=" * 70)
        print("❌ CALENDAR INVITE SENDING FAILED")
        print("ERROR:", str(e))
        traceback.print_exc()
        print("=" * 70 + "\n")
        return False


def send_email(receiver_email, subject, body):
    """Generic plain-text sender, reusing the same SMTP config as send_invoice_email().
    Returns (success: bool, error_message: str | None) instead of raising, so callers
    can log the outcome without their own business logic failing on an SMTP error."""
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = receiver_email
        msg.set_content(body)

        with _smtp_connect_ipv4(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)

        return True, None

    except Exception as e:
        print("send_email failed:", e)
        return False, str(e)