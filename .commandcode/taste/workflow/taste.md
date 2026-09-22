# Workflow & Engineering Preferences

- All changes must be additive and non-destructive to already-working functionality: no redesign, rewrite, refactor, or replacement of existing behavior unless explicitly requested; work as a UI/feature enhancement, not an application rewrite. Confidence: 0.9
- Stay inside the existing stack for existing pages (Next.js Pages Router, plain JS, styled-jsx; FastAPI + SQLAlchemy + PostgreSQL) and do not introduce new languages/frameworks into them. Confidence: 0.8
- Do not add new dependencies or upgrade existing ones. Confidence: 0.8
- Avoid new APIs or schema changes unless proven necessary; when DB changes are unavoidable, apply them additively (ADD COLUMN IF NOT EXISTS, no Alembic migrations). Confidence: 0.8
- Do not touch unrelated modules, routes, fields, or names when making a scoped change, and do not do unrelated cleanup. Confidence: 0.8
- Prefers exports/reports branded with the existing professional PDF template (navy/gold Platypus style already used by the invoice generator) rather than ad-hoc layouts. Confidence: 0.8
- When a request conflicts with established project principles, prefers being asked to clarify with explicit options rather than having the trade-off silently decided. Confidence: 0.7
- Never delete or modify data not created by the current work session; assume the user may be using the live app concurrently. Confidence: 0.7
- Wants changes verified live in a browser (real data rendered, screenshots compared, zero console errors) before being reported as done. Confidence: 0.7
- When extending a component shared by multiple pages, new behavior must be optional/backward-compatible so other pages render unchanged. Confidence: 0.65
- When a mentor's session is scheduled, rescheduled, or deleted, expects the mentor to be notified by email using the email address looked up fresh from Mentor Management. Confidence: 0.75
- Writes terse, lowercase, typo-heavy, screenshot-driven instructions (e.g., "make it same as given in the image", "remove this which in red box") and expects them interpreted charitably and literally. Confidence: 0.7
- When told to "make this own" instead of relying on an external service/credentials, expects an internal implementation using existing infrastructure rather than an external integration. Confidence: 0.6
