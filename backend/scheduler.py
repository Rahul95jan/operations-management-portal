import os
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

# The background job itself always starts — whether it actually DOES anything
# is controlled live by the "Reminder Scheduler" toggle in Settings (DB-backed,
# no restart needed), not by an env var. REMINDER_INTERVAL_HOURS still needs a
# restart to change, since APScheduler's tick cadence is fixed at job creation.
REMINDER_INTERVAL_HOURS = float(os.getenv("RESOURCE_REMINDER_INTERVAL_HOURS", "1"))

_scheduler = None


def run_reminder_check(dry_run=False, respect_toggle=True):
    """Finds Overdue requirements due for a reminder and sends one each
    (respecting the reminder_interval_hours gate enforced inside
    _send_reminder_for_requirement, via next_reminder_at).
    dry_run=True reports what WOULD happen without sending anything.
    respect_toggle=True (the background job) no-ops entirely if the Settings
    "Reminder Scheduler" toggle is off, or if it's outside the configured
    reminder time-of-day window; the manual /resource-scheduler/run endpoint
    passes False so Operations can always trigger a check on demand."""
    from database import SessionLocal
    from models.resource_requirement import ResourceRequirement
    from resource_tracking import refresh_requirement_status
    from app_settings import get_settings
    from resource_scheduling import is_within_reminder_window
    from main import _send_reminder_for_requirement

    db = SessionLocal()
    result = {"checked": 0, "reminded": 0, "candidates": [], "skipped": [], "errors": []}

    try:
        settings = get_settings(db)

        if respect_toggle and not settings.reminder_scheduler_enabled:
            result["scheduler_disabled"] = True
            return result

        now = datetime.utcnow()

        if respect_toggle and not is_within_reminder_window(now, settings):
            result["outside_window"] = True
            return result

        requirements = (
            db.query(ResourceRequirement)
            .filter(ResourceRequirement.status.notin_(["Complete", "Not Required"]))
            .all()
        )

        for r in requirements:
            refresh_requirement_status(r, now)
        db.commit()

        result["checked"] = len(requirements)

        candidates = [
            r for r in requirements
            if r.status == "Overdue"
            and (r.next_reminder_at is None or r.next_reminder_at <= now)
        ]

        for r in candidates:
            result["candidates"].append({
                "requirement_id": r.id,
                "session_id": r.session_id,
                "resource_name": r.resource_name,
                "reminder_count": r.reminder_count,
            })

            if dry_run:
                continue

            sent, error = _send_reminder_for_requirement(db, r)

            if error:
                result["skipped"].append({"requirement_id": r.id, "reason": error})
            elif sent:
                result["reminded"] += 1
            else:
                result["errors"].append({"requirement_id": r.id, "reason": "email send failed"})

        return result

    finally:
        db.close()


def start_scheduler():
    global _scheduler

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        run_reminder_check,
        "interval",
        hours=REMINDER_INTERVAL_HOURS,
        id="resource_reminder_check",
        replace_existing=True,
    )
    _scheduler.start()
    print(f"▶  Resource reminder scheduler running every {REMINDER_INTERVAL_HOURS}h (actual sending controlled by Settings)")
    return _scheduler


def stop_scheduler():
    global _scheduler

    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
