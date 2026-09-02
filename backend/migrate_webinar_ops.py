"""Additive migration for the Webinar Operations module.

Adds nullable columns to zoom_analytics and invoices (existing tables —
create_tables.py's Base.metadata.create_all never adds columns to a table
that already exists). The new webinar_participants table itself is created
by create_tables.py (already registered there), not here.

Run once against the live DB after deploying the updated models, before
restarting the backend. Safe to re-run (IF NOT EXISTS).
"""

from sqlalchemy import text
from database import engine

STATEMENTS = [
    "ALTER TABLE zoom_analytics ADD COLUMN IF NOT EXISTS description VARCHAR",
    "ALTER TABLE zoom_analytics ADD COLUMN IF NOT EXISTS category VARCHAR",
    "ALTER TABLE zoom_analytics ADD COLUMN IF NOT EXISTS target_audience VARCHAR",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS source_type VARCHAR DEFAULT 'batch'",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS webinar_id INTEGER",
    "UPDATE invoices SET source_type = 'batch' WHERE source_type IS NULL",
    "CREATE INDEX IF NOT EXISTS ix_invoices_webinar_id ON invoices(webinar_id)",
]

if __name__ == "__main__":
    with engine.begin() as conn:
        for stmt in STATEMENTS:
            print(f"-> {stmt.strip().splitlines()[0]}...")
            conn.execute(text(stmt))

    print("=" * 50)
    print("✅ Webinar Operations migration applied")
    print("=" * 50)
