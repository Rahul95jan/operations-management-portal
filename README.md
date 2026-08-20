# Operations Management Portal

An internal operations platform for **Krish Naik Academy** — session scheduling, mentor & batch management, invoicing, learner feedback (NPS), Zoom webinar analytics, and a full mentor **Resource Portal** with automated tracking, reminders, and compliance analytics.

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
- Webinar attendance, chat, and poll analytics per session

### Resource Portal
A complete mentor resource management system:
- **Submission** — mentors submit session resources (GitHub, Notion, Drive, Docs, Sheets, files) with type-aware smart inputs
- **Tracking** — one row per session: required vs. received vs. missing, with live status and delay calculation
- **Automatic reminders** — background scheduler emails mentors daily until resources are submitted, with a global safety kill-switch
- **Resource Analytics** — completion rate, on-time rate, submission/reminder trends, resource type distribution
- **Mentor Performance** — compliance scoring, worst-performer-first tables, weekly compliance heatmap
- **LMS-ready downloads** — per-resource preview/download, or a full session ZIP package with an auto-generated manifest
- **Pending Resources** view with one-click manual reminders
- **Search, filters, and CSV/Excel export** across tracking data
- **Live Settings** — email notifications, reminder scheduler, escalation thresholds, and default deadlines — all configurable at runtime, no restart required

---

## 🧱 Tech Stack

**Frontend**
- Next.js (Pages Router) + React
- Inline styles / `styled-jsx` — no CSS framework (charts use **Recharts**, not the `chart.js` package listed in `package.json`)
- Axios / native `fetch`

**Backend**
- FastAPI + SQLAlchemy + Pydantic
- PostgreSQL (Neon)
- APScheduler — background reminder job
- ReportLab — PDF generation (invoices, webinar reports, NPS/resource reports)
- `smtplib` — email delivery

---

## 📂 Project Structure

```
backend/
├── main.py                    # All API routes (single FastAPI app)
├── database.py                 # DB engine/session setup
├── models/                     # SQLAlchemy models
├── *_schemas.py                 # Pydantic request/response schemas
├── *_insights.py, *_tracking.py, *_analytics.py, *_export.py
│                                # Business logic per module (NPS, Resources)
├── scheduler.py                 # APScheduler reminder job
├── email_service.py             # SMTP sending
├── pdf_generator.py             # ReportLab PDF builders
└── services/storage.py          # File storage abstraction (local now, swappable later)

frontend/
├── pages/                     # Next.js routes
│   ├── nps/, resources/, resource-analytics/
└── components/                 # Shared + per-module components
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

Create the tables, then start the server:

```bash
python create_tables.py
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## ⚙️ Runtime Settings

Most operational behavior — email notifications, the reminder scheduler, escalation thresholds, deadline defaults — is configurable **live** from the in-app **Settings** page, backed by the database. Check Settings before relying on automated reminder emails in a new environment; the scheduler and notification toggles ship with safe defaults.

---

## ⚠️ Known Limitations

- **No real authentication.** Login is a hardcoded client-side check (`admin` / `admin123`); no API endpoint enforces server-side auth. Do not deploy this publicly without adding real authentication first.
- A few analytics endpoints (placement stats, some trend charts) currently return illustrative/mock data rather than computed values.
