# Operations Management Portal

An internal operations platform for **Krish Naik Academy** — session scheduling, mentor & batch management, invoicing, learner feedback (NPS), Zoom webinar analytics, a full mentor **Resource Portal**, a **Mentor Business Performance (Mentor 360)** scoring layer, and a complete **Webinar Operations & Business Intelligence** module (scheduling, leads, payouts, and analytics).

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)

---

## ✨ What's Inside

### Core Operations
- **Sessions** — schedule, track, and export session records
- **Mentors** & **Batches** — CRUD management
- **Invoices** — PDF generation + email delivery to mentors, payment status tracking
- **Analytics Dashboard** — sessions, mentors, batches, revenue, placements, at-risk batches

### Learner Feedback (NPS)
- Branded multi-step NPS feedback form — auto-fills course/batch/mentor details from the selected session
- NPS Analytics dashboard — promoter/passive/detractor breakdown, mentor/course/batch performance, keyword-mined learner concerns, auto-generated business recommendations, CSV/Excel/PDF export

### Zoom Analytics
- Webinar attendance, chat, and poll analytics per session (raw Zoom-derived metrics — see **Webinar Operations** below for the full lifecycle built on top of this data)

### Resource Portal
A complete mentor resource management system:
- **Submission** — mentors submit session resources (GitHub, Notion, Drive, Docs, Sheets, files) with type-aware smart inputs, tagged by both **category** (what it is — Session Notes, Code/Notebook, Assignment, etc.) and **type** (how it's submitted)
- **No-login mentor submission links** — each session gets a stable, unguessable token URL (`/resources/submit/{token}`) emailed to the mentor; opens pre-filled with that session's context, no shared password needed
- **Tracking** — one row per session: required vs. received vs. missing, with live status and delay calculation
- **Automatic reminders** — background scheduler emails mentors on a configurable interval (default every 2 hours) within a configurable time-of-day window, with Saturday/Sunday sessions defaulting to a first-half-of-Monday deadline; a global safety kill-switch and manual-override endpoint are both available
- **Resource Analytics** — completion rate, on-time rate, submission/reminder trends, resource type/category distribution, **At-Risk Mentors** view
- **Resource Compliance ("Mentor Performance")** — the sidebar's *Mentor Performance* page under Resource Portal scores mentors purely on submission compliance; this is distinct from the business-wide **Mentor 360** score described below
- **LMS-ready downloads** — per-resource preview/download, or a full session ZIP package with an auto-generated manifest
- **Pending Resources** view with one-click manual reminders
- **Search, filters, and CSV/Excel export** across tracking data
- **Live Settings** — email notifications, reminder scheduler (interval, time window, weekend-deadline rule), escalation thresholds, and default deadlines — all configurable at runtime, no restart required

### Mentor Business Performance (Mentor 360)
A business-intelligence layer over data that already exists elsewhere in the app — no duplicated tables:
- **8-dimension weighted score** — Delivery Performance, Attendance & Engagement, Learner Experience (NPS-derived), Session Quality, Resource Compliance, Reliability, Productivity, and Cost Efficiency (peer-relative, so a pricier-but-excellent mentor is never penalized)
- **Missing-data handling** — a dimension with no underlying data shows "N/A", never a fabricated 0; the overall score renormalizes across only the dimensions that have real data
- **Dashboard** (`/mentor-performance`) — KPI cards, classification/risk breakdown charts, a Score-vs-Cost scatter, a filterable scorecard table
- **Mentor 360 detail page** (`/mentor-performance/{mentor}`) — full dimension breakdown, a radar chart of the mentor's performance "shape," a 6-month score trend, and a peer-context performance matrix
- **Filters** — course, batch, mentor, date range, classification, risk — shared identically by the dashboard, the table, and both exports (one source of truth)
- **Excel (6-sheet) and PDF export**, respecting whatever filters are active

### Webinar Operations & Business Intelligence
The full webinar lifecycle — plan → schedule → execute → report → pay mentors → track leads → business insights — built as an extension of the existing Zoom Analytics data (`ZoomAnalytics` *is* the Webinar entity; no duplicate table):
- **Scheduler** (`/webinars`) — create/edit/duplicate/cancel/delete webinars, filterable list with registration/attendance/lead/payout columns at a glance
- **Report Detail** (`/webinars/{id}`) — live-computed KPIs (registered, attended, unique/new/existing users, rating, qualified/converted leads, conversion %) that prefer real participant records over legacy aggregate stats, with inline attendance/rating/lead-status editing
- **Participants & Lead Intelligence** — per-registrant records with a heuristic existing-user match (against NPS feedback + prior webinar history — there's no real learner/CRM directory in this system, so this is explicitly a best-effort signal, not authoritative), lead status (New → Interested → Qualified → Converted, etc.), and a dedicated **Leads / Conversion** page for the sales team
- **Mentor Payout** (`/webinars/payouts`) — computed from duration × mentor hourly rate, created as an Invoice row (an additive extension of the existing invoice system, not a second one) with its own payment-status lifecycle
- **Dashboard & Business Insights** (`/webinars/dashboard`) — 12 KPIs, registration/lead-funnel charts, and **dynamically generated** insight cards (Audience / Performance / Sales / Financial) built from the live filtered dataset — never hardcoded copy
- **Excel/PDF export** and a **generic CSV/XLSX participant importer** (`/webinars/import` — upload → preview → map columns → dedup-safe commit) built for eventual migration off spreadsheets, without assuming any one sheet's exact column layout
- **Learner 360** (`/webinars/learner-360`) — search any email to see their full webinar/lead history, since there's no separate learner directory to link to
- **Mentor 360 integration** — a supplementary "Webinar Performance" section on the existing Mentor 360 detail page (leads/conversions/payout per mentor), not a second scoring system

---

## 🧱 Tech Stack

**Frontend**
- Next.js (Pages Router) + React
- Inline styles / `styled-jsx` — no CSS framework, no Tailwind/shadcn (charts use **Recharts**, not the `chart.js` package listed in `package.json`)
- Axios / native `fetch`

**Backend**
- FastAPI + SQLAlchemy + Pydantic
- PostgreSQL (Neon)
- APScheduler — background reminder job
- ReportLab — PDF generation (invoices, webinar reports, NPS/resource/mentor-performance/webinar-operations reports)
- `smtplib` — email delivery
- `pandas` / `openpyxl` — Excel export and CSV/XLSX import

---

## 📂 Project Structure

```
backend/
├── main.py                       # All API routes (single FastAPI app)
├── database.py                    # DB engine/session setup
├── models/                        # SQLAlchemy models
├── *_schemas.py                    # Pydantic request/response schemas
├── *_insights.py, *_tracking.py, *_analytics.py, *_export.py
│                                   # Business logic per module (NPS, Resources)
├── mentor_performance.py           # Mentor 360 scoring service (single source of truth)
├── webinar_operations.py           # Webinar lifecycle, leads, payout, dashboard/insights, import/export
├── scheduler.py                    # APScheduler reminder job (Resource Portal)
├── email_service.py                # SMTP sending
├── pdf_generator.py                # ReportLab PDF builders
├── create_tables.py                # Creates any NEW tables (safe to re-run)
├── migrate_resource_v2.py          # One-time additive migration — Resource Portal redesign
├── migrate_webinar_ops.py          # One-time additive migration — Webinar Operations columns
└── services/storage.py             # File storage abstraction (local now, swappable later)

frontend/
├── pages/                        # Next.js routes
│   ├── nps/, resources/, resource-analytics/, mentor-performance/, webinars/
└── components/                    # Shared + per-module components
    ├── resources/, mentorPerformance/
```

---

## 🚀 Getting Started

### 1. Clone

```bash
git clone https://github.com/Rahul95jan/operations-management-portal.git
cd operations-management-portal
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# Optional — all have sensible defaults
RESOURCE_REMINDER_INTERVAL_HOURS=1
RESOURCE_UPLOAD_DIR=uploads/resources
LMS_PACKAGE_DIR=uploads/lms_packages
PORTAL_URL=http://localhost:3000
```

Create the tables, apply the additive migrations (safe to re-run, `IF NOT EXISTS` throughout), then start the server:

```bash
python create_tables.py
python migrate_resource_v2.py
python migrate_webinar_ops.py
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

> This project has no migration framework (no Alembic) — new tables are created by `create_tables.py`, and new columns on already-existing tables are added by the `migrate_*.py` scripts. Both are idempotent; run them again any time without risk.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## ⚙️ Runtime Settings

Most operational behavior — email notifications, the reminder scheduler (interval, time window, weekend-deadline rule), escalation thresholds, deadline defaults — is configurable **live** from the in-app **Settings** page, backed by the database. Check Settings before relying on automated reminder emails in a new environment; the scheduler and notification toggles ship with safe defaults.

Mentor 360's dimension weights and Webinar Operations' payout/lead-status vocabularies are currently plain Python constants (`mentor_performance.py`, `webinar_operations.py`) rather than DB-backed settings — deliberately, to avoid over-engineering a v1.

---

## ⚠️ Known Limitations

- **No real authentication.** Login is a hardcoded client-side check (`admin` / `admin123`); no API endpoint enforces server-side auth, and there is no role-based access control anywhere in the app. Do not deploy this publicly without adding real authentication first.
- **No Learner/User directory.** There is no table of individual learners/customers anywhere in this system — only aggregate counts on `Batch` and per-submission emails on `NPSFeedback`/`WebinarParticipant`. "Existing user" matching (Resource Portal, Webinar leads, Learner 360) is a best-effort heuristic based on prior activity, not an authoritative enrollment/CRM check.
- A few analytics endpoints (placement stats, some trend charts) currently return illustrative/mock data rather than computed values.
- Webinar schedule import (from a Google Sheet or similar) isn't built yet — only the participant/lead importer (`/webinars/import`) exists so far.
