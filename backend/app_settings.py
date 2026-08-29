def get_settings(db):
    from models.app_settings import AppSettings

    settings = db.query(AppSettings).first()

    if not settings:
        settings = AppSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


def settings_to_dict(s):
    return {
        "email_notifications_enabled": s.email_notifications_enabled,
        "ops_notification_email": s.ops_notification_email,
        "reminder_scheduler_enabled": s.reminder_scheduler_enabled,
        "max_reminders_before_final": s.max_reminders_before_final,
        "resource_default_deadline_hours": s.resource_default_deadline_hours,
        "reminder_interval_hours": s.reminder_interval_hours,
        "reminder_window_start_hour": s.reminder_window_start_hour,
        "reminder_window_end_hour": s.reminder_window_end_hour,
        "reminder_timezone": s.reminder_timezone,
        "weekend_deadline_enabled": s.weekend_deadline_enabled,
        "updated_at": s.updated_at,
    }
