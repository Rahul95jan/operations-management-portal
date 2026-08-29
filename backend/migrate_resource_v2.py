"""One-off additive migration for the Resource Portal redesign.

create_tables.py's Base.metadata.create_all only creates missing TABLES, never
adds missing COLUMNS to existing ones — this project has no migration
framework. Run this manually, once, against the live DB after deploying the
updated models, before restarting the backend. Safe to re-run (IF NOT EXISTS).
"""

from sqlalchemy import text
from database import engine

STATEMENTS = [
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS resource_category VARCHAR",
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS session_date VARCHAR",
    "ALTER TABLE resource_requirements ADD COLUMN IF NOT EXISTS resource_category VARCHAR",
    "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS resource_access_token VARCHAR",
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_sessions_resource_access_token ON sessions(resource_access_token)",
    "ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS reminder_interval_hours FLOAT DEFAULT 2.0",
    "ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS reminder_window_start_hour INTEGER DEFAULT 10",
    "ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS reminder_window_end_hour INTEGER DEFAULT 14",
    "ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS reminder_timezone VARCHAR DEFAULT 'Asia/Kolkata'",
    "ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS weekend_deadline_enabled BOOLEAN DEFAULT TRUE",
    """UPDATE app_settings SET
        reminder_interval_hours = COALESCE(reminder_interval_hours, 2.0),
        reminder_window_start_hour = COALESCE(reminder_window_start_hour, 10),
        reminder_window_end_hour = COALESCE(reminder_window_end_hour, 14),
        reminder_timezone = COALESCE(reminder_timezone, 'Asia/Kolkata'),
        weekend_deadline_enabled = COALESCE(weekend_deadline_enabled, TRUE)
    """,
]

if __name__ == "__main__":
    with engine.begin() as conn:
        for stmt in STATEMENTS:
            print(f"-> {stmt.strip().splitlines()[0]}...")
            conn.execute(text(stmt))

    print("=" * 50)
    print("✅ Resource Portal v2 migration applied")
    print("=" * 50)
