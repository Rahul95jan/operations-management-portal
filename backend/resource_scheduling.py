from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


def _parse_session_date(session_date):
    if not session_date:
        return None
    try:
        return datetime.strptime(session_date, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def compute_due_at(session, settings, now=None):
    """Deadline for a newly-configured resource requirement.

    Saturday/Sunday sessions (when weekend_deadline_enabled) get a due date on
    the FOLLOWING Monday at reminder_window_start_hour, in the configured
    timezone. Everything else — weekday sessions, an unparseable session_date,
    or the setting turned off — falls back to the original flat-hours
    behavior, unchanged."""
    now = now or datetime.utcnow()
    flat_fallback = now + timedelta(hours=settings.resource_default_deadline_hours)

    if not settings.weekend_deadline_enabled:
        return flat_fallback

    session_date = _parse_session_date(getattr(session, "session_date", None))
    if not session_date:
        return flat_fallback

    weekday = session_date.weekday()  # Monday=0 ... Sunday=6
    if weekday not in (5, 6):  # not Saturday/Sunday
        return flat_fallback

    days_to_monday = 7 - weekday  # Saturday(5)->2, Sunday(6)->1
    monday = session_date + timedelta(days=days_to_monday)

    tz = ZoneInfo(settings.reminder_timezone or "Asia/Kolkata")
    local_due = datetime(
        monday.year, monday.month, monday.day,
        settings.reminder_window_start_hour or 10, 0, 0,
        tzinfo=tz,
    )
    return local_due.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)


def is_within_reminder_window(now_utc, settings):
    """Whether AUTOMATIC reminders are allowed to fire right now. Manual
    "Send Reminder" always bypasses this (ops override)."""
    start_hour = settings.reminder_window_start_hour
    end_hour = settings.reminder_window_end_hour

    if start_hour is None or end_hour is None or start_hour >= end_hour:
        return True  # misconfigured — fail open rather than silently blocking everything

    tz = ZoneInfo(settings.reminder_timezone or "Asia/Kolkata")
    local_now = now_utc.replace(tzinfo=ZoneInfo("UTC")).astimezone(tz)
    return start_hour <= local_now.hour < end_hour
