import pandas as pd
from datetime import datetime, timedelta
from fastapi.responses import FileResponse

from fastapi import FastAPI, Depends, Form, File, UploadFile
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from models.operations import OperationsAnalytics

from models.resource import Resource
from models.resource_requirement import ResourceRequirement
from models.audit_log import AuditLog
from resource_schemas import (
    ResourceUpdate,
    ResourceRequirementCreate,
    ResourceRequirementStatusUpdate,
    AppSettingsUpdate,
)
from app_settings import get_settings, settings_to_dict
from services.storage import save_file
from resource_tracking import (
    build_tracking_table,
    refresh_requirement_status,
    compute_delay,
    session_resource_detail,
    list_pending_requirements,
)
from resource_downloads import build_lms_package, lms_filename
from models.resource_download_log import ResourceDownloadLog
from models.resource_email_log import ResourceEmailLog
from resource_emails import initial_request_email, reminder_email, confirmation_email, ops_notification_email
from email_service import send_email as send_generic_email
from scheduler import start_scheduler, stop_scheduler, run_reminder_check, REMINDER_INTERVAL_HOURS
from resource_analytics import compute_resource_analytics, compute_mentor_performance, compute_mentor_heatmap
from resource_export import build_export_rows
import os

OPS_NOTIFICATION_EMAIL = os.getenv("OPS_NOTIFICATION_EMAIL")

from database import SessionLocal
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.user import User
from models.session import Session as SessionModel
from models.mentor import Mentor
from models.batch import Batch
from models.invoice import Invoice
from models.nps import NPSFeedback
from schemas import NPSCreate
from models.session_analytics import SessionAnalytics
from database import engine
from models.user import Base
from pdf_generator import generate_invoice, generate_webinar_report, generate_nps_report, generate_analytics_report
from nps_insights import compute_nps_insights
from models.invoice import Invoice
from schemas import InvoiceCreate
import os

from email_service import send_invoice_email
from models.invoice import Invoice
print("Invoice Columns:", Invoice.__table__.columns.keys())
from email_service import send_invoice_email



from schemas import (
    UserCreate,
    SessionCreate,
    MentorCreate,
    BatchCreate,
    InvoiceCreate,
    SessionAnalyticsCreate,
)

app = FastAPI()


@app.on_event("startup")
def _start_resource_scheduler():
    start_scheduler()


@app.on_event("shutdown")
def _stop_resource_scheduler():
    stop_scheduler()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# CORS
# ==========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# HOME
# ==========================

@app.get("/")
def home():
    return {
        "message": "Operations Portal API Running"
    }

# ==========================
# USERS
# ==========================

@app.post("/users")
def create_user(user: UserCreate):
    return {
        "message": "User Created",
        "data": user
    }

# ==========================
# SESSIONS
# ==========================

@app.post("/sessions")
def create_session(session: SessionCreate):

    db = SessionLocal()

    new_session = SessionModel(
        topic=session.topic,
        mentor_name=session.mentor_name,
        batch_name=session.batch_name,
        session_date=session.session_date,
        session_time=session.session_time,
        status=session.status
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    db.close()

    return {
        "message": "Session Created Successfully",
        "id": new_session.id
    }


@app.get("/sessions")
def get_sessions(db: Session = Depends(get_db)):

    sessions = db.query(SessionModel).all()

    return sessions

@app.put("/sessions/{session_id}")
def update_session(session_id: int, session: SessionCreate):

    db = SessionLocal()

    existing_session = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id)
        .first()
    )

    if not existing_session:
        db.close()
        return {"message": "Session Not Found"}

    existing_session.topic = session.topic
    existing_session.mentor_name = session.mentor_name
    existing_session.batch_name = session.batch_name
    existing_session.session_date = session.session_date
    existing_session.session_time = session.session_time
    existing_session.status = session.status

    db.commit()
    db.refresh(existing_session)

    db.close()

    return {
        "message": "Session Updated Successfully"
    }


@app.delete("/sessions/{session_id}")
def delete_session(session_id: int):

    db = SessionLocal()

    session = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id)
        .first()
    )

    if session:
        db.delete(session)
        db.commit()

    db.close()

    return {
        "message": "Session Deleted Successfully"
    }

# ==========================
# MENTORS
# ==========================

@app.post("/mentors")
def create_mentor(mentor: MentorCreate):

    db = SessionLocal()

    new_mentor = Mentor(
        name=mentor.name,
        email=mentor.email,
        phone=mentor.phone,
        expertise=mentor.expertise,
        linkedin=mentor.linkedin,
        hourly_rate=mentor.hourly_rate
    )

    db.add(new_mentor)
    db.commit()
    db.refresh(new_mentor)

    db.close()

    return {
        "message": "Mentor Created Successfully",
        "id": new_mentor.id
    }


@app.get("/mentors")
def get_mentors(db: Session = Depends(get_db)):

    mentors = db.query(Mentor).all()

    return mentors


@app.put("/mentors/{mentor_id}")
def update_mentor(mentor_id: int, mentor: MentorCreate):

    db = SessionLocal()

    existing_mentor = (
        db.query(Mentor)
        .filter(Mentor.id == mentor_id)
        .first()
    )

    if not existing_mentor:
        db.close()
        return {
            "message": "Mentor Not Found"
        }

    existing_mentor.name = mentor.name
    existing_mentor.email = mentor.email
    existing_mentor.phone = mentor.phone
    existing_mentor.expertise = mentor.expertise
    existing_mentor.linkedin = mentor.linkedin
    existing_mentor.hourly_rate = mentor.hourly_rate

    db.commit()
    db.refresh(existing_mentor)

    db.close()

    return {
        "message": "Mentor Updated Successfully"
    }


@app.delete("/mentors/{mentor_id}")
def delete_mentor(mentor_id: int):

    db = SessionLocal()

    mentor = (
        db.query(Mentor)
        .filter(Mentor.id == mentor_id)
        .first()
    )

    if mentor:
        db.delete(mentor)
        db.commit()

    db.close()

    return {
        "message": "Mentor Deleted Successfully"
    }

# ==========================
# BATCHES
# ==========================

@app.post("/batches")
def create_batch(batch: BatchCreate):

    db = SessionLocal()

    new_batch = Batch(
        batch_name=batch.batch_name,
        course_name=batch.course_name,
        strength=batch.strength,
        mentor_name=batch.mentor_name
    )

    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    db.close()

    return {
        "message": "Batch Created Successfully",
        "id": new_batch.id
    }
@app.put("/batches/{batch_id}")
def update_batch(batch_id: int, batch: BatchCreate):

    db = SessionLocal()

    existing_batch = (
        db.query(Batch)
        .filter(Batch.id == batch_id)
        .first()
    )

    if not existing_batch:
        db.close()
        return {
            "message": "Batch Not Found"
        }

    existing_batch.batch_name = batch.batch_name
    existing_batch.course_name = batch.course_name
    existing_batch.strength = batch.strength
    existing_batch.mentor_name = batch.mentor_name

    db.commit()
    db.refresh(existing_batch)

    db.close()

    return {
        "message": "Batch Updated Successfully"
    }

@app.get("/batches")
def get_batches(db: Session = Depends(get_db)):

    batches = db.query(Batch).all()

    return batches

@app.delete("/batches/{batch_id}")
def delete_batch(batch_id: int):

    db = SessionLocal()

    batch = (
        db.query(Batch)
        .filter(Batch.id == batch_id)
        .first()
    )

    if batch:
        db.delete(batch)
        db.commit()

    db.close()

    return {
        "message": "Batch Deleted Successfully"
    }

# ==========================
# DASHBOARD
# ==========================

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):

    data = {
        "total_users": db.query(User).count(),
        "total_sessions": db.query(SessionModel).count(),
        "total_mentors": db.query(Mentor).count(),
        "total_batches": db.query(Batch).count()
    }

    return data

# ==========================
# ANALYTICS
# ==========================

@app.get("/recent-sessions")
def recent_sessions():

    db = SessionLocal()

    sessions = (
        db.query(SessionModel)
        .order_by(SessionModel.id.desc())
        .limit(5)
        .all()
    )

    db.close()

    return sessions
@app.get("/recent-batches")
def recent_batches():

    db = SessionLocal()

    batches = (
        db.query(Batch)
        .order_by(Batch.id.desc())
        .limit(5)
        .all()
    )

    db.close()

    return batches

@app.get("/analytics")
def analytics():

    db = SessionLocal()

    data = {
        "total_users": db.query(User).count(),
        "total_sessions": db.query(SessionModel).count(),
        "total_mentors": db.query(Mentor).count(),
        "total_batches": db.query(Batch).count(),

        "scheduled_sessions":
            db.query(SessionModel)
            .filter(SessionModel.status == "Scheduled")
            .count(),

        "completed_sessions":
            db.query(SessionModel)
            .filter(SessionModel.status == "Completed")
            .count()
    }

    db.close()

    return data

@app.get("/recent-mentors")
def recent_mentors():

    db = SessionLocal()

    mentors = (
        db.query(Mentor)
        .order_by(Mentor.id.desc())
        .limit(5)
        .all()
    )

    db.close()

    return mentors

@app.get("/upcoming-sessions")
def upcoming_sessions():

    db = SessionLocal()

    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.status == "Scheduled")
        .order_by(SessionModel.session_date.asc())
        .limit(5)
        .all()
    )

    db.close()

    return sessions

@app.get("/export-sessions")
def export_sessions():

    db = SessionLocal()

    sessions = db.query(SessionModel).all()

    data = []

    for session in sessions:
        data.append({
            "ID": session.id,
            "Topic": session.topic,
            "Mentor": session.mentor_name,
            "Batch": session.batch_name,
            "Date": session.session_date,
            "Time": session.session_time,
            "Status": session.status
        })

    df = pd.DataFrame(data)

    file_name = "sessions.xlsx"

    df.to_excel(
        file_name,
        index=False
    )

    db.close()

    return FileResponse(
        file_name,
        filename=file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
@app.get("/dashboard/overview")
def dashboard_overview(db: Session = Depends(get_db)):
    print("1")

    total_mentors = db.query(Mentor).count()
    print("2")

    total_batches = db.query(Batch).count()
    print("3")

    total_sessions = db.query(SessionModel).count()
    print("4")

    scheduled_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.status == "Scheduled")
        .count()
    )
    print("5")

    completed_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.status == "Completed")
        .count()
    )
    print("6")

    active_mentors = (
        db.query(Mentor)
        .filter(Mentor.status == "Active")
        .count()
    )
    print("7")

    return {
        "total_mentors": total_mentors,
        "total_batches": total_batches,
        "total_sessions": total_sessions,
        "scheduled_sessions": scheduled_sessions,
        "completed_sessions": completed_sessions,
        "active_mentors": active_mentors,
    }
@app.get("/dashboard/session-analytics")
def session_analytics(
    course_name: Optional[str] = None,
    mentor_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
):
    base_query = db.query(SessionModel)
    if course_name:
        base_query = base_query.filter(SessionModel.course_name == course_name)
    if mentor_name:
        base_query = base_query.filter(SessionModel.mentor_name == mentor_name)
    if date_from:
        base_query = base_query.filter(SessionModel.session_date >= date_from)
    if date_to:
        base_query = base_query.filter(SessionModel.session_date <= date_to)

    total_sessions = base_query.count()
    completed_sessions = base_query.filter(SessionModel.status == "Completed").count()
    scheduled_sessions = base_query.filter(SessionModel.status == "Scheduled").count()
    cancelled_sessions = base_query.filter(SessionModel.status == "Cancelled").count()

    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "scheduled_sessions": scheduled_sessions,
        "cancelled_sessions": cancelled_sessions
    }
@app.get("/dashboard/mentor-analytics")
def mentor_analytics(
    course_name: Optional[str] = None,
    mentor_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Mentor)

    if course_name:
        course_mentor_names = [
            b.mentor_name for b in db.query(Batch).filter(Batch.course_name == course_name).all()
            if b.mentor_name
        ]
        query = query.filter(Mentor.name.in_(course_mentor_names))

    if mentor_name:
        query = query.filter(Mentor.name == mentor_name)

    total_mentors = query.count()
    active_mentors = query.filter(Mentor.status == "Active").count()
    inactive_mentors = query.filter(Mentor.status == "Inactive").count()
    mentors = query.all()

    total_rate = 0

    for mentor in mentors:
        try:
            total_rate += int(mentor.hourly_rate)
        except:
            pass

    average_hourly_rate = (
        total_rate / total_mentors
        if total_mentors > 0
        else 0
    )

    return {
        "total_mentors": total_mentors,
        "active_mentors": active_mentors,
        "inactive_mentors": inactive_mentors,
        "average_hourly_rate": round(average_hourly_rate, 2)
    }
@app.get("/dashboard/batch-analytics")
def batch_analytics(
    course_name: Optional[str] = None,
    mentor_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Batch)
    if course_name:
        query = query.filter(Batch.course_name == course_name)
    if mentor_name:
        query = query.filter(Batch.mentor_name == mentor_name)

    total_batches = query.count()

    batches = query.all()

    total_strength = 0

    for batch in batches:
        if batch.strength:
            total_strength += batch.strength

    average_batch_strength = (
        total_strength / total_batches
        if total_batches > 0
        else 0
    )

    return {
        "total_batches": total_batches,
        "total_strength": total_strength,
        "average_batch_strength": round(
            average_batch_strength,
            2
        )
    }
@app.get("/dashboard/revenue-analytics")
def revenue_analytics(db: Session = Depends(get_db)):

    invoices = db.query(Invoice).all()

    total_invoices = len(invoices)

    total_revenue = 0
    paid_amount = 0
    pending_amount = 0

    for invoice in invoices:

        try:
            amount = int(invoice.total_amount)
        except:
            amount = 0

        total_revenue += amount

        if invoice.payment_status == "Paid":
            paid_amount += amount
        else:
            pending_amount += amount

    return {
        "total_invoices": total_invoices,
        "total_revenue": total_revenue,
        "paid_amount": paid_amount,
        "pending_amount": pending_amount
    }
@app.get("/dashboard/top-mentors")

def top_mentors(
    course_name: Optional[str] = None,
    mentor_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    mentor_query = db.query(Mentor)

    if course_name:
        course_mentor_names = [
            b.mentor_name for b in db.query(Batch).filter(Batch.course_name == course_name).all()
            if b.mentor_name
        ]
        mentor_query = mentor_query.filter(Mentor.name.in_(course_mentor_names))

    if mentor_name:
        mentor_query = mentor_query.filter(Mentor.name == mentor_name)

    mentors = mentor_query.all()

    leaderboard = []

    for mentor in mentors:

        session_query = db.query(SessionModel).filter(SessionModel.mentor_name == mentor.name)
        if course_name:
            session_query = session_query.filter(SessionModel.course_name == course_name)

        session_count = session_query.count()

        try:
            rate = int(mentor.hourly_rate)
        except:
            rate = 0

        revenue = session_count * 2 * rate

        leaderboard.append({
            "mentor_name": mentor.name,
            "sessions": session_count,
            "hourly_rate": rate,
            "revenue": revenue
        })

    leaderboard = sorted(
        leaderboard,
        key=lambda x: x["revenue"],
        reverse=True
    )

    return leaderboard


@app.get("/dashboard/top-batches")
def top_batches(
    course_name: Optional[str] = None,
    mentor_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Batch)
    if course_name:
        query = query.filter(Batch.course_name == course_name)
    if mentor_name:
        query = query.filter(Batch.mentor_name == mentor_name)

    batches = query.all()

    leaderboard = []

    for batch in batches:

        session_count = (
            db.query(SessionModel)
            .filter(SessionModel.batch_name == batch.batch_name)
            .count()
        )

        leaderboard.append({
            "batch_name": batch.batch_name,
            "course_name": batch.course_name,
            "mentor_name": batch.mentor_name,
            "strength": batch.strength,
            "sessions": session_count
        })

    leaderboard = sorted(
        leaderboard,
        key=lambda x: x["sessions"],
        reverse=True
    )

    return leaderboard


@app.post("/invoices")
def create_invoice(invoice: InvoiceCreate):

    db = SessionLocal()

    try:
        # =====================================
        # Get the next invoice number
        # =====================================

        last_invoice = (
            db.query(Invoice)
            .order_by(Invoice.id.desc())
            .first()
        )

        next_number = (last_invoice.id + 1) if last_invoice else 1
        invoice_number = f"INV-{next_number:05d}"

        # =====================================
        # Create Invoice
        # =====================================

        new_invoice = Invoice(
            invoice_number=invoice_number,
            mentor_name=invoice.mentor_name,
            mentor_email=invoice.mentor_email,
            batch_name=invoice.batch_name,
            month=invoice.month,
            total_sessions=invoice.total_sessions,
            total_hours=invoice.total_hours,
            hourly_rate=invoice.hourly_rate,
            total_amount=invoice.total_amount,
            payment_status="Pending",
        )

        db.add(new_invoice)
        db.commit()
        db.refresh(new_invoice)

        # =====================================
        # Debug
        # =====================================

        print("=" * 60)
        print("Invoice ID      :", new_invoice.id)
        print("Invoice Number  :", new_invoice.invoice_number)
        print("Mentor          :", new_invoice.mentor_name)
        print("Payment Status  :", new_invoice.payment_status)
        print("=" * 60)

        # =====================================
        # Generate PDF
        # =====================================

        pdf_path = generate_invoice(new_invoice)

        print("PDF Generated:", pdf_path)

        return {
            "message": "Invoice Created Successfully",
            "invoice_id": new_invoice.id,
            "invoice_number": new_invoice.invoice_number,
            "payment_status": new_invoice.payment_status,
            "pdf": pdf_path,
        }

    except Exception as e:
        db.rollback()
        print("Invoice Error:", e)
        return {"error": str(e)}

    finally:
        db.close()


# =====================================================
# Download Invoice (Always Generate Latest PDF)
# =====================================================

@app.get("/download-invoice/{invoice_id}")
def download_invoice(invoice_id: int):

    db = SessionLocal()

    try:
        # Fetch latest invoice from database
        invoice = (
            db.query(Invoice)
            .filter(Invoice.id == invoice_id)
            .first()
        )

        if not invoice:
            return {"error": "Invoice not found"}

        print("=" * 60)
        print("Downloading Invoice")
        print("Invoice Number :", invoice.invoice_number)
        print("Payment Status :", invoice.payment_status)
        print("=" * 60)

        # Always regenerate PDF using latest database values
        pdf_path = generate_invoice(invoice)

        return FileResponse(
            path=pdf_path,
            filename=f"{invoice.invoice_number}.pdf",
            media_type="application/pdf",
        )

    except Exception as e:
        print("Download Error:", e)
        return {"error": str(e)}

    finally:
        db.close()


# ---------------------------------------------------------
# Send Invoice Email
# ---------------------------------------------------------

from fastapi import HTTPException
import traceback
import os

@app.post("/send-invoice/{invoice_id}")
def send_invoice(invoice_id: int):

    db = SessionLocal()

    try:
        # Get Invoice
        invoice = (
            db.query(Invoice)
            .filter(Invoice.id == invoice_id)
            .first()
        )

        if not invoice:
            return {
                "success": False,
                "message": "Invoice not found"
            }

        # Get Mentor
        mentor = (
            db.query(Mentor)
            .filter(Mentor.name == invoice.mentor_name)
            .first()
        )

        if not mentor:
            return {
                "success": False,
                "message": "Mentor not found"
            }

        # Get email
        mentor_email = invoice.mentor_email or mentor.email

        if not mentor_email:
            return {
                "success": False,
                "message": "Mentor email not found"
            }

        # Save email into invoice if missing
        if invoice.mentor_email != mentor_email:
            invoice.mentor_email = mentor_email
            db.commit()

        pdf_path = f"pdfs/invoice_{invoice_id}.pdf"

        if not os.path.exists(pdf_path):
            return {
                "success": False,
                "message": f"PDF not found: {pdf_path}"
            }

        print("=" * 60)
        print("Invoice ID :", invoice.id)
        print("Mentor     :", invoice.mentor_name)
        print("Email      :", mentor_email)
        print("PDF        :", pdf_path)
        print("=" * 60)

        success = send_invoice_email(
            receiver_email=mentor_email,
            pdf_path=pdf_path,
            invoice_number=invoice.invoice_number,
        )

        print("send_invoice_email returned:", success)

        if success:
            return {
                "success": True,
                "message": "Invoice sent successfully"
            }

        return {
            "success": False,
            "message": "send_invoice_email() returned False"
        }

    except Exception as e:
        traceback.print_exc()

        return {
            "success": False,
            "message": str(e)
        }

    finally:
        db.close()

@app.get("/invoices")
def get_invoices(db: Session = Depends(get_db)):

    invoices = db.query(Invoice).all()

    result = []

    for invoice in invoices:
        result.append({
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "mentor_name": invoice.mentor_name,
            "mentor_email": invoice.mentor_email,
            "batch_name": invoice.batch_name,
            "month": invoice.month,
            "total_sessions": invoice.total_sessions,
            "total_hours": invoice.total_hours,
            "hourly_rate": invoice.hourly_rate,
            "total_amount": invoice.total_amount,
            "payment_status": invoice.payment_status,
        })

    return result

@app.get("/batch-names")
def get_batch_names():

    db = SessionLocal()

    try:
        batches = db.query(Batch).all()
        return batches
    finally:
        db.close()

@app.get("/invoice-summary")
def invoice_summary():
    db = SessionLocal()

    invoices = db.query(Invoice).all()

    total_amount = 0
    total_hours = 0
    total_sessions = 0
    pending_amount = 0
    total_invoices = len(invoices)

    for invoice in invoices:

        total_amount += float(invoice.total_amount or 0)
        total_hours += float(invoice.total_hours or 0)
        total_sessions += invoice.total_sessions or 0

        if invoice.payment_status == "Pending":
            pending_amount += float(invoice.total_amount or 0)

    db.close()

    return {
        "total_amount": total_amount,
        "pending_amount": pending_amount,
        "total_hours": total_hours,
        "total_sessions": total_sessions,
        "total_invoices": total_invoices
    }

@app.put("/invoice-paid/{invoice_id}")
def mark_invoice_paid(invoice_id: int):

    db = SessionLocal()

    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    if not invoice:
        db.close()
        return {"message": "Invoice not found"}

    invoice.payment_status = "Paid"

    db.commit()
    db.refresh(invoice)

    db.close()

    return {
        "message": "Invoice marked as Paid"
    }
    
@app.get("/invoice/{invoice_id}")
def get_invoice(invoice_id: int):

    db = SessionLocal()

    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    db.close()

    return invoice

@app.put("/invoice/{invoice_id}")
def update_invoice(invoice_id: int, updated_invoice: InvoiceCreate):

    db = SessionLocal()

    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    if not invoice:
        db.close()
        return {"message": "Invoice not found"}

    invoice.mentor_name = updated_invoice.mentor_name
    invoice.batch_name = updated_invoice.batch_name
    invoice.month = updated_invoice.month
    invoice.total_sessions = updated_invoice.total_sessions
    invoice.total_hours = updated_invoice.total_hours
    invoice.hourly_rate = updated_invoice.hourly_rate
    invoice.total_amount = updated_invoice.total_amount
    invoice.payment_status = updated_invoice.payment_status

    db.commit()
    db.refresh(invoice)

    db.close()

    return {
        "message": "Invoice Updated Successfully"
    }

@app.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: int):

    db = SessionLocal()

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

    if not invoice:
        db.close()
        return {"message": "Invoice not found"}

    db.delete(invoice)
    db.commit()
    db.close()

    return {"message": "Invoice deleted successfully"}

# ==========================================================
# NPS FEEDBACK
# ==========================================================

@app.post("/nps")
def create_nps(data: NPSCreate):

    db = SessionLocal()

    try:

        existing = (
            db.query(NPSFeedback)
            .filter(
                (NPSFeedback.learner_email == data.learner_email) |
                (NPSFeedback.mobile_number == data.mobile_number)
            )
            .first()
        )

        if existing:
            return {
                "success": False,
                "message": "Email or Mobile Number already exists."
            }

        feedback = NPSFeedback(
            learner_name=data.learner_name,
            learner_email=data.learner_email,
            mobile_number=data.mobile_number,
            course_name=data.course_name,
            batch_name=data.batch_name,
            mentor_name=data.mentor_name,
            instructor_rating=data.instructor_rating,
            doubt_rating=data.doubt_rating,
            website_rating=data.website_rating,
            nps_score=data.nps_score,
            feedback=data.feedback,
        )

        db.add(feedback)
        db.commit()
        db.refresh(feedback)

        return {
            "success": True,
            "message": "NPS Feedback Submitted Successfully",
            "id": feedback.id
        }

    finally:
        db.close()


def _filtered_nps_query(db, course_name=None, batch_name=None, mentor_name=None):
    query = db.query(NPSFeedback)

    if course_name:
        query = query.filter(NPSFeedback.course_name == course_name)
    if batch_name:
        query = query.filter(NPSFeedback.batch_name == batch_name)
    if mentor_name:
        query = query.filter(NPSFeedback.mentor_name == mentor_name)

    return query


@app.get("/nps")
def get_nps(course_name: str = None, batch_name: str = None, mentor_name: str = None):

    db = SessionLocal()

    try:

        feedbacks = _filtered_nps_query(db, course_name, batch_name, mentor_name).all()

        return [
            {
                "id": item.id,
                "learner_name": item.learner_name,
                "learner_email": item.learner_email,
                "mobile_number": item.mobile_number,
                "course_name": item.course_name,
                "batch_name": item.batch_name,
                "mentor_name": item.mentor_name,
                "instructor_rating": item.instructor_rating,
                "doubt_rating": item.doubt_rating,
                "website_rating": item.website_rating,
                "nps_score": item.nps_score,
                "feedback": item.feedback,
                "created_at": item.created_at,
            }
            for item in feedbacks
        ]

    finally:
        db.close()


@app.get("/nps/{feedback_id}")
def get_nps_by_id(feedback_id: int):

    db = SessionLocal()

    try:

        feedback = (
            db.query(NPSFeedback)
            .filter(NPSFeedback.id == feedback_id)
            .first()
        )

        if not feedback:
            return {"message": "Feedback Not Found"}

        return feedback

    finally:
        db.close()


@app.put("/nps/{feedback_id}")
def update_nps(feedback_id: int, data: NPSCreate):

    db = SessionLocal()

    try:
        feedback = (
            db.query(NPSFeedback)
            .filter(NPSFeedback.id == feedback_id)
            .first()
        )

        if not feedback:
            return {"message": "Feedback Not Found"}

        # Check if email or mobile already exists for another record
        existing = (
            db.query(NPSFeedback)
            .filter(
                (
                    (NPSFeedback.learner_email == data.learner_email) |
                    (NPSFeedback.mobile_number == data.mobile_number)
                ) &
                (NPSFeedback.id != feedback_id)
            )
            .first()
        )

        if existing:
            return {
                "message": "Email or Mobile Number already exists."
            }

        feedback.learner_name = data.learner_name
        feedback.learner_email = data.learner_email
        feedback.mobile_number = data.mobile_number
        feedback.course_name = data.course_name
        feedback.batch_name = data.batch_name
        feedback.mentor_name = data.mentor_name
        feedback.instructor_rating = data.instructor_rating
        feedback.doubt_rating = data.doubt_rating
        feedback.website_rating = data.website_rating
        feedback.nps_score = data.nps_score
        feedback.feedback = data.feedback

        db.commit()
        db.refresh(feedback)

        return {
            "message": "Feedback Updated Successfully"
        }

    finally:
        db.close()

@app.delete("/nps/{feedback_id}")
def delete_nps(feedback_id: int):

    db = SessionLocal()

    try:

        feedback = (
            db.query(NPSFeedback)
            .filter(NPSFeedback.id == feedback_id)
            .first()
        )

        if not feedback:
            return {"message": "Feedback Not Found"}

        db.delete(feedback)
        db.commit()

        return {
            "message": "Feedback Deleted Successfully"
        }

    finally:
        db.close()


# ==========================================================
# NPS Insights & Export
# ==========================================================

@app.get("/nps-insights")
def nps_insights(course_name: str = None, batch_name: str = None, mentor_name: str = None):

    db = SessionLocal()

    try:
        records = _filtered_nps_query(db, course_name, batch_name, mentor_name).all()
        return compute_nps_insights(records)

    finally:
        db.close()


@app.get("/export-nps")
def export_nps(course_name: str = None, batch_name: str = None, mentor_name: str = None):

    db = SessionLocal()

    try:
        records = _filtered_nps_query(db, course_name, batch_name, mentor_name).all()

        data = []

        for r in records:
            data.append({
                "ID": r.id,
                "Learner Name": r.learner_name,
                "Email": r.learner_email,
                "Mobile": r.mobile_number,
                "Course": r.course_name,
                "Batch": r.batch_name,
                "Mentor": r.mentor_name,
                "Instructor Rating": r.instructor_rating,
                "Doubt Rating": r.doubt_rating,
                "Website Rating": r.website_rating,
                "NPS Score": r.nps_score,
                "Feedback": r.feedback,
                "Submitted": r.created_at,
            })

        df = pd.DataFrame(data)

        file_name = "nps_responses.xlsx"
        df.to_excel(file_name, index=False)

        return FileResponse(
            file_name,
            filename=file_name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    finally:
        db.close()


@app.get("/export-nps-report")
def export_nps_report(course_name: str = None, batch_name: str = None, mentor_name: str = None):

    db = SessionLocal()

    try:
        records = _filtered_nps_query(db, course_name, batch_name, mentor_name).all()
        insights = compute_nps_insights(records)

        pdf_path = generate_nps_report(records, insights)

        return FileResponse(
            path=pdf_path,
            filename="NPS_Analytics_Report.pdf",
            media_type="application/pdf",
        )

    finally:
        db.close()

@app.post("/session-analytics")
def create_session_analytics(data: SessionAnalyticsCreate):

    db = SessionLocal()

    analytics = SessionAnalytics(
        session_id=data.session_id,
        mentor_name=data.mentor_name,
        batch_name=data.batch_name,
        scheduled_duration=data.scheduled_duration,
        actual_duration=data.actual_duration,
        mentor_join_time=data.mentor_join_time,
        mentor_leave_time=data.mentor_leave_time,
        first_student_join=data.first_student_join,
        last_student_leave=data.last_student_leave,
        registered_count=data.registered_count,
        joined_count=data.joined_count,
        unique_attendance=data.unique_attendance,
        duplicate_joins=data.duplicate_joins,
        attendance_percentage=data.attendance_percentage,
        late_joiners=data.late_joiners,
        early_leavers=data.early_leavers,
        poll_count=data.poll_count,
        poll_participants=data.poll_participants,
        quiz_count=data.quiz_count,
        quiz_participants=data.quiz_participants,
        average_quiz_score=data.average_quiz_score,
        chat_messages=data.chat_messages,
        private_messages=data.private_messages,
        public_messages=data.public_messages,
        questions_asked=data.questions_asked,
        questions_answered=data.questions_answered,
        recording_available=data.recording_available,
        recording_duration=data.recording_duration,
    )

    db.add(analytics)
    db.commit()
    db.refresh(analytics)
    db.close()

    return {
        "message": "Session Analytics Created Successfully",
        "id": analytics.id,
    }

@app.get("/session-analytics")
def get_session_analytics():

    db = SessionLocal()

    analytics = db.query(SessionAnalytics).all()

    db.close()

    return analytics

@app.put("/session-analytics/{analytics_id}")
def update_session_analytics(
    analytics_id: int,
    data: SessionAnalyticsCreate
):

    db = SessionLocal()

    analytics = (
        db.query(SessionAnalytics)
        .filter(SessionAnalytics.id == analytics_id)
        .first()
    )

    if not analytics:
        db.close()
        return {"message": "Analytics Not Found"}

    analytics.session_id = data.session_id
    analytics.mentor_name = data.mentor_name
    analytics.batch_name = data.batch_name
    analytics.scheduled_duration = data.scheduled_duration
    analytics.actual_duration = data.actual_duration
    analytics.mentor_join_time = data.mentor_join_time
    analytics.mentor_leave_time = data.mentor_leave_time
    analytics.first_student_join = data.first_student_join
    analytics.last_student_leave = data.last_student_leave
    analytics.registered_count = data.registered_count
    analytics.joined_count = data.joined_count
    analytics.unique_attendance = data.unique_attendance
    analytics.duplicate_joins = data.duplicate_joins
    analytics.attendance_percentage = data.attendance_percentage
    analytics.late_joiners = data.late_joiners
    analytics.early_leavers = data.early_leavers
    analytics.poll_count = data.poll_count
    analytics.poll_participants = data.poll_participants
    analytics.quiz_count = data.quiz_count
    analytics.quiz_participants = data.quiz_participants
    analytics.average_quiz_score = data.average_quiz_score
    analytics.chat_messages = data.chat_messages
    analytics.private_messages = data.private_messages
    analytics.public_messages = data.public_messages
    analytics.questions_asked = data.questions_asked
    analytics.questions_answered = data.questions_answered
    analytics.recording_available = data.recording_available
    analytics.recording_duration = data.recording_duration

    db.commit()
    db.refresh(analytics)
    db.close()

    return {
        "message": "Session Analytics Updated Successfully"
    }   


@app.delete("/session-analytics/{analytics_id}")
def delete_session_analytics(analytics_id: int):

    db = SessionLocal()

    analytics = (
        db.query(SessionAnalytics)
        .filter(SessionAnalytics.id == analytics_id)
        .first()
    )

    if not analytics:
        db.close()
        return {"message": "Session Analytics Not Found"}

    db.delete(analytics)
    db.commit()
    db.close()

    return {
        "message": "Session Analytics Deleted Successfully"
    }
@app.get("/session-analytics-summary")
def session_analytics_summary():

    db = SessionLocal()

    analytics = db.query(SessionAnalytics).all()

    total_sessions = len(analytics)

    registered = sum(a.registered_count or 0 for a in analytics)

    joined = sum(a.joined_count or 0 for a in analytics)

    unique_attendance = sum(a.unique_attendance or 0 for a in analytics)

    mentor_hours = sum(a.mentor_total_hours or 0 for a in analytics)

    student_hours = sum(a.students_total_hours or 0 for a in analytics)

    total_duration = sum(a.actual_duration or 0 for a in analytics)

    attendance_percentage = (
        round((joined / registered) * 100, 2)
        if registered > 0
        else 0
    )

    db.close()

    return {
        "total_sessions": total_sessions,
        "registered": registered,
        "joined": joined,
        "unique_attendance": unique_attendance,
        "attendance_percentage": attendance_percentage,
        "mentor_hours": mentor_hours,
        "student_hours": student_hours,
        "total_duration": total_duration,
    }

@app.get("/attendance-trend")
def attendance_trend():

    db = SessionLocal()

    analytics = db.query(SessionAnalytics).all()

    chart = []

    for item in analytics:
        chart.append({
            "session": item.session_id,
            "attendance": item.attendance_percentage
        })

    db.close()

    return chart

@app.get("/poll-summary")
def poll_summary():

    db = SessionLocal()

    analytics = db.query(SessionAnalytics).all()

    total_polls = sum(a.poll_count or 0 for a in analytics)

    total_participants = sum(a.poll_participants or 0 for a in analytics)

    average_participation = (
        round(total_participants / total_polls, 2)
        if total_polls > 0
        else 0
    )

    average_accuracy = (
        round(
            sum(a.poll_accuracy or 0 for a in analytics) / len(analytics),
            2
        )
        if analytics
        else 0
    )

    db.close()

    return {
        "total_polls": total_polls,
        "total_participants": total_participants,
        "average_participation": average_participation,
        "average_accuracy": average_accuracy,
    }
@app.get("/quiz-summary")
def quiz_summary():

    db = SessionLocal()

    analytics = db.query(SessionAnalytics).all()

    total_quizzes = sum(a.quiz_count or 0 for a in analytics)

    total_participants = sum(a.quiz_participants or 0 for a in analytics)

    average_score = (
        round(
            sum(a.average_quiz_score or 0 for a in analytics) /
            len(analytics),
            2
        )
        if analytics
        else 0
    )

    db.close()

    return {
        "total_quizzes": total_quizzes,
        "total_participants": total_participants,
        "average_score": average_score,
    }
@app.get("/mentor-performance")
def mentor_performance():

    db = SessionLocal()

    analytics = db.query(SessionAnalytics).all()

    mentor_data = {}

    for a in analytics:

        mentor = a.mentor_name

        if mentor not in mentor_data:
            mentor_data[mentor] = {
                "mentor_name": mentor,
                "sessions": 0,
                "attendance": 0,
                "polls": 0,
                "hours": 0,
            }

        mentor_data[mentor]["sessions"] += 1
        mentor_data[mentor]["attendance"] += a.attendance_percentage or 0
        mentor_data[mentor]["polls"] += a.poll_count or 0
        mentor_data[mentor]["hours"] += a.mentor_total_hours or 0

    result = []

    for mentor in mentor_data.values():

        mentor["attendance"] = round(
            mentor["attendance"] / mentor["sessions"], 2
        )

        result.append(mentor)

    db.close()

    return result

@app.get("/poll-trend")
def poll_trend():

    db = SessionLocal()

    analytics = db.query(SessionAnalytics).all()

    result = []

    for item in analytics:
        result.append({
            "session": item.session_id,
            "polls": item.poll_count
        })

    db.close()

    return result


@app.get("/batch-analytics")
def batch_analytics(course_name: Optional[str] = None, mentor_name: Optional[str] = None):

    db = SessionLocal()

    query = db.query(Batch)
    if course_name:
        query = query.filter(Batch.course_name == course_name)
    if mentor_name:
        query = query.filter(Batch.mentor_name == mentor_name)

    batches = query.all()

    total_batches = len(batches)

    completed_batches = len(
        [b for b in batches if b.status == "Completed"]
    )

    ongoing_batches = len(
        [b for b in batches if b.status == "Ongoing"]
    )

    delayed_batches = len(
        [b for b in batches if b.status == "Delayed"]
    )

    average_attendance = (
        round(
            sum(b.attendance_percentage or 0 for b in batches)
            / total_batches,
            2,
        )
        if total_batches > 0
        else 0
    )

    average_completion = (
        round(
            sum(b.completion_percentage or 0 for b in batches)
            / total_batches,
            2,
        )
        if total_batches > 0
        else 0
    )

    average_health = (
        round(
            sum(b.health_score or 0 for b in batches)
            / total_batches,
            2,
        )
        if total_batches > 0
        else 0
    )

    db.close()

    return {
        "total_batches": total_batches,
        "completed_batches": completed_batches,
        "ongoing_batches": ongoing_batches,
        "delayed_batches": delayed_batches,
        "average_attendance": average_attendance,
        "average_completion": average_completion,
        "average_health": average_health,
    }
@app.get("/batch-performance")
def batch_performance(course_name: Optional[str] = None, mentor_name: Optional[str] = None):

    db = SessionLocal()

    try:

        query = db.query(Batch)
        if course_name:
            query = query.filter(Batch.course_name == course_name)
        if mentor_name:
            query = query.filter(Batch.mentor_name == mentor_name)

        batches = query.all()

        data = []

        for batch in batches:
            data.append({
                "id": batch.id,
                "batch_name": batch.batch_name,
                "mentor_name": batch.mentor_name,
                "strength": batch.strength,
                "attendance_percentage": batch.attendance_percentage,
                "completion_percentage": batch.completion_percentage,
                "health_score": batch.health_score,
                "status": batch.status,
            })

        return data

    finally:
        db.close()

@app.get("/learner-analytics")
def learner_analytics(course_name: Optional[str] = None, mentor_name: Optional[str] = None):

    db = SessionLocal()

    try:

        query = db.query(Batch)
        if course_name:
            query = query.filter(Batch.course_name == course_name)
        if mentor_name:
            query = query.filter(Batch.mentor_name == mentor_name)

        batches = query.all()

        total_learners = sum(b.strength or 0 for b in batches)

        active_learners = sum(b.active_learners or 0 for b in batches)

        inactive_learners = sum(b.inactive_learners or 0 for b in batches)

        dropout_count = sum(b.dropout_count or 0 for b in batches)

        average_completion = (
            round(
                sum(b.course_completion or 0 for b in batches)
                / len(batches),
                2,
            )
            if batches
            else 0
        )

        return {
            "total_learners": total_learners,
            "active_learners": active_learners,
            "inactive_learners": inactive_learners,
            "dropout_count": dropout_count,
            "average_completion": average_completion,
        }

    finally:
        db.close()

@app.get("/operations-analytics")
def operations_analytics(course_name: Optional[str] = None, mentor_name: Optional[str] = None):

    db = SessionLocal()

    try:

        query = db.query(OperationsAnalytics)
        if course_name:
            batch_names = [
                b.batch_name for b in db.query(Batch).filter(Batch.course_name == course_name).all()
                if b.batch_name
            ]
            query = query.filter(OperationsAnalytics.batch_name.in_(batch_names))
        if mentor_name:
            query = query.filter(OperationsAnalytics.mentor_name == mentor_name)

        operations = query.all()

        total_projects = len(operations)

        total_sessions = sum(o.total_sessions or 0 for o in operations)

        completed_sessions = sum(o.completed_sessions or 0 for o in operations)

        cancelled_sessions = sum(o.cancelled_sessions or 0 for o in operations)

        average_sla = (
            round(
                sum(o.sla_percentage or 0 for o in operations) / len(operations),
                2,
            )
            if operations else 0
        )

        average_completion = (
            round(
                sum(o.completion_percentage or 0 for o in operations) / len(operations),
                2,
            )
            if operations else 0
        )

        average_mentor_utilization = (
            round(
                sum(o.mentor_utilization or 0 for o in operations) / len(operations),
                2,
            )
            if operations else 0
        )

        average_resource_utilization = (
            round(
                sum(o.resource_utilization or 0 for o in operations) / len(operations),
                2,
            )
            if operations else 0
        )

        average_productivity = (
            round(
                sum(o.productivity_score or 0 for o in operations) / len(operations),
                2,
            )
            if operations else 0
        )

        return {
            "total_projects": total_projects,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "cancelled_sessions": cancelled_sessions,
            "average_sla": average_sla,
            "average_completion": average_completion,
            "average_mentor_utilization": average_mentor_utilization,
            "average_resource_utilization": average_resource_utilization,
            "average_productivity": average_productivity,
        }

    finally:
        db.close()

@app.get("/at-risk-batches")
def at_risk_batches(course_name: Optional[str] = None, mentor_name: Optional[str] = None):

    db = SessionLocal()

    try:

        query = db.query(Batch).filter(Batch.health_score < 70)
        if course_name:
            query = query.filter(Batch.course_name == course_name)
        if mentor_name:
            query = query.filter(Batch.mentor_name == mentor_name)

        batches = query.all()

        data = []

        for batch in batches:
            data.append({
                "batch_name": batch.batch_name,
                "mentor_name": batch.mentor_name,
                "attendance": batch.attendance_percentage,
                "completion": batch.completion_percentage,
                "health": batch.health_score,
                "status": batch.status,
            })

        return data

    finally:
        db.close()

@app.get("/session-trend")
def session_trend():

    data = [
        {
            "month": "Jan",
            "completed": 120,
            "cancelled": 8,
        },
        {
            "month": "Feb",
            "completed": 135,
            "cancelled": 6,
        },
        {
            "month": "Mar",
            "completed": 150,
            "cancelled": 10,
        },
        {
            "month": "Apr",
            "completed": 165,
            "cancelled": 5,
        },
        {
            "month": "May",
            "completed": 180,
            "cancelled": 7,
        },
        {
            "month": "Jun",
            "completed": 195,
            "cancelled": 4,
        },
    ]

    return data

@app.get("/revenue-trend")
def revenue_trend():

    data = [
        {
            "month": "Jan",
            "revenue": 125000,
        },
        {
            "month": "Feb",
            "revenue": 148000,
        },
        {
            "month": "Mar",
            "revenue": 172000,
        },
        {
            "month": "Apr",
            "revenue": 195000,
        },
        {
            "month": "May",
            "revenue": 218000,
        },
        {
            "month": "Jun",
            "revenue": 245000,
        },
    ]

    return data

@app.get("/batch-health-chart")
def batch_health_chart():

    data = [
        {
            "batch": "June",
            "health": 82,
        },
        {
            "batch": "July",
            "health": 76,
        },
        {
            "batch": "August",
            "health": 91,
        },
        {
            "batch": "September",
            "health": 68,
        },
        {
            "batch": "October",
            "health": 88,
        },
    ]

    return data

@app.get("/executive-summary")
def executive_summary(
    course_name: Optional[str] = None,
    mentor_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):

    db = SessionLocal()

    try:

        # Projects (not yet tracked per-course; shown as an overall figure)
        total_projects = 12

        # Sessions
        session_query = db.query(SessionModel)
        if course_name:
            session_query = session_query.filter(SessionModel.course_name == course_name)
        if mentor_name:
            session_query = session_query.filter(SessionModel.mentor_name == mentor_name)
        if date_from:
            session_query = session_query.filter(SessionModel.session_date >= date_from)
        if date_to:
            session_query = session_query.filter(SessionModel.session_date <= date_to)
        total_sessions = session_query.count()

        # Batches
        batch_query = db.query(Batch)
        if course_name:
            batch_query = batch_query.filter(Batch.course_name == course_name)
        if mentor_name:
            batch_query = batch_query.filter(Batch.mentor_name == mentor_name)
        batches = batch_query.all()
        total_batches = len(batches)

        # Mentors
        mentor_query = db.query(Mentor)
        if mentor_name:
            mentor_query = mentor_query.filter(Mentor.name == mentor_name)
        elif course_name:
            course_mentor_names = [b.mentor_name for b in batches if b.mentor_name]
            mentor_query = mentor_query.filter(Mentor.name.in_(course_mentor_names))
        total_mentors = mentor_query.count()

        # Learners
        total_learners = sum(
            batch.strength or 0
            for batch in batches
        )

        # Temporary Revenue
        total_revenue = 0

        # Temporary KPIs
        active_issues = 3
        health_score = 92

        return {
            "total_projects": total_projects,
            "total_sessions": total_sessions,
            "total_batches": total_batches,
            "total_mentors": total_mentors,
            "total_learners": total_learners,
            "total_revenue": total_revenue,
            "active_issues": active_issues,
            "health_score": health_score,
        }

    except Exception as e:
        return {
            "error": str(e)
        }

    finally:
        db.close()


@app.get("/placement-summary")
def placement_summary():

    return {
        "eligible_students": 320,
        "placed_students": 185,
        "placement_rate": 57.8,
        "interview_scheduled": 42,
        "offers_received": 210,
        "companies_hiring": 28,
        "average_ctc": 7.2,
        "highest_ctc": 18.5,
    }
@app.get("/placement-status")
def placement_status():

    return [
        {
            "status": "Placed",
            "students": 185,
        },
        {
            "status": "Interview Scheduled",
            "students": 42,
        },
        {
            "status": "Offer Received",
            "students": 25,
        },
        {
            "status": "Preparing",
            "students": 68,
        }
    ]


def _gather_analytics_data(db, course_name=None, mentor_name=None, date_from=None, date_to=None):
    """Builds every section of the Analytics Dashboard as plain dicts/lists,
    applying the same course/mentor/date filters as the individual endpoints.
    Shared by the Excel and PDF export endpoints so both stay in sync with
    what's actually shown on screen."""

    # Sessions
    session_query = db.query(SessionModel)
    if course_name:
        session_query = session_query.filter(SessionModel.course_name == course_name)
    if mentor_name:
        session_query = session_query.filter(SessionModel.mentor_name == mentor_name)
    if date_from:
        session_query = session_query.filter(SessionModel.session_date >= date_from)
    if date_to:
        session_query = session_query.filter(SessionModel.session_date <= date_to)

    total_sessions = session_query.count()
    completed_sessions = session_query.filter(SessionModel.status == "Completed").count()
    scheduled_sessions = session_query.filter(SessionModel.status == "Scheduled").count()
    cancelled_sessions = session_query.filter(SessionModel.status == "Cancelled").count()

    session_summary = {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "scheduled_sessions": scheduled_sessions,
        "cancelled_sessions": cancelled_sessions,
    }

    # Batches
    batch_query = db.query(Batch)
    if course_name:
        batch_query = batch_query.filter(Batch.course_name == course_name)
    if mentor_name:
        batch_query = batch_query.filter(Batch.mentor_name == mentor_name)
    batches = batch_query.all()
    total_batches = len(batches)

    batch_summary = {
        "total_batches": total_batches,
        "completed_batches": len([b for b in batches if b.status == "Completed"]),
        "ongoing_batches": len([b for b in batches if b.status == "Ongoing"]),
        "delayed_batches": len([b for b in batches if b.status == "Delayed"]),
        "average_attendance": round(sum(b.attendance_percentage or 0 for b in batches) / total_batches, 2) if total_batches else 0,
        "average_completion": round(sum(b.completion_percentage or 0 for b in batches) / total_batches, 2) if total_batches else 0,
        "average_health": round(sum(b.health_score or 0 for b in batches) / total_batches, 2) if total_batches else 0,
    }

    batch_performance = [
        {
            "batch_name": b.batch_name,
            "mentor_name": b.mentor_name,
            "strength": b.strength,
            "attendance_percentage": b.attendance_percentage,
            "completion_percentage": b.completion_percentage,
            "health_score": b.health_score,
            "status": b.status,
        }
        for b in batches
    ]

    at_risk_batches = [
        {
            "batch_name": b.batch_name,
            "mentor_name": b.mentor_name,
            "attendance": b.attendance_percentage,
            "completion": b.completion_percentage,
            "health": b.health_score,
            "status": b.status,
        }
        for b in batches
        if (b.health_score or 0) < 70
    ]

    # Mentors
    mentor_query = db.query(Mentor)
    if mentor_name:
        mentor_query = mentor_query.filter(Mentor.name == mentor_name)
    elif course_name:
        course_mentor_names = [b.mentor_name for b in batches if b.mentor_name]
        mentor_query = mentor_query.filter(Mentor.name.in_(course_mentor_names))
    mentors = mentor_query.all()
    total_mentors = len(mentors)

    total_rate = 0
    for m in mentors:
        try:
            total_rate += int(m.hourly_rate)
        except Exception:
            pass

    mentor_summary = {
        "total_mentors": total_mentors,
        "active_mentors": len([m for m in mentors if m.status == "Active"]),
        "inactive_mentors": len([m for m in mentors if m.status == "Inactive"]),
        "average_hourly_rate": round(total_rate / total_mentors, 2) if total_mentors else 0,
    }

    top_mentors = []
    for m in mentors:
        sq = db.query(SessionModel).filter(SessionModel.mentor_name == m.name)
        if course_name:
            sq = sq.filter(SessionModel.course_name == course_name)
        session_count = sq.count()
        try:
            rate = int(m.hourly_rate)
        except Exception:
            rate = 0
        top_mentors.append({
            "mentor_name": m.name,
            "sessions": session_count,
            "hourly_rate": rate,
            "revenue": session_count * 2 * rate,
        })
    top_mentors.sort(key=lambda x: x["revenue"], reverse=True)

    top_batches = []
    for b in batches:
        session_count = db.query(SessionModel).filter(SessionModel.batch_name == b.batch_name).count()
        top_batches.append({
            "batch_name": b.batch_name,
            "course_name": b.course_name,
            "mentor_name": b.mentor_name,
            "strength": b.strength,
            "sessions": session_count,
        })
    top_batches.sort(key=lambda x: x["sessions"], reverse=True)

    # Learners
    learner_summary = {
        "total_learners": sum(b.strength or 0 for b in batches),
        "active_learners": sum(b.active_learners or 0 for b in batches),
        "inactive_learners": sum(b.inactive_learners or 0 for b in batches),
        "dropout_count": sum(b.dropout_count or 0 for b in batches),
        "average_completion": round(sum(b.course_completion or 0 for b in batches) / total_batches, 2) if total_batches else 0,
    }

    # Operations
    ops_query = db.query(OperationsAnalytics)
    if course_name:
        batch_names = [b.batch_name for b in batches if b.batch_name]
        ops_query = ops_query.filter(OperationsAnalytics.batch_name.in_(batch_names))
    if mentor_name:
        ops_query = ops_query.filter(OperationsAnalytics.mentor_name == mentor_name)
    operations = ops_query.all()
    ops_count = len(operations)

    operations_summary = {
        "total_projects": ops_count,
        "total_sessions": sum(o.total_sessions or 0 for o in operations),
        "completed_sessions": sum(o.completed_sessions or 0 for o in operations),
        "cancelled_sessions": sum(o.cancelled_sessions or 0 for o in operations),
        "average_sla": round(sum(o.sla_percentage or 0 for o in operations) / ops_count, 2) if ops_count else 0,
        "average_completion": round(sum(o.completion_percentage or 0 for o in operations) / ops_count, 2) if ops_count else 0,
        "average_mentor_utilization": round(sum(o.mentor_utilization or 0 for o in operations) / ops_count, 2) if ops_count else 0,
        "average_resource_utilization": round(sum(o.resource_utilization or 0 for o in operations) / ops_count, 2) if ops_count else 0,
        "average_productivity": round(sum(o.productivity_score or 0 for o in operations) / ops_count, 2) if ops_count else 0,
    }

    # Executive summary (total_projects/active_issues/health_score are not
    # yet tracked per-course — shown as overall figures, same as the UI)
    completion_rate = round((completed_sessions / total_sessions) * 100, 1) if total_sessions else 0

    executive_summary = {
        "total_projects": 12,
        "total_sessions": total_sessions,
        "total_batches": total_batches,
        "total_mentors": total_mentors,
        "total_learners": learner_summary["total_learners"],
        "completion_rate": completion_rate,
        "active_issues": 3,
        "health_score": 92,
    }

    return {
        "executive_summary": executive_summary,
        "session_summary": session_summary,
        "mentor_summary": mentor_summary,
        "batch_summary": batch_summary,
        "batch_performance": batch_performance,
        "at_risk_batches": at_risk_batches,
        "learner_summary": learner_summary,
        "operations_summary": operations_summary,
        "top_mentors": top_mentors,
        "top_batches": top_batches,
        "placement_summary": placement_summary(),
    }


def _filter_description(course_name, mentor_name, date_from, date_to):
    parts = []
    if course_name:
        parts.append(f"Course = {course_name}")
    if mentor_name:
        parts.append(f"Mentor = {mentor_name}")
    if date_from:
        parts.append(f"From {date_from}")
    if date_to:
        parts.append(f"To {date_to}")
    return "; ".join(parts) if parts else "All data (no filters applied)"


@app.get("/export-analytics")
def export_analytics(
    course_name: Optional[str] = None,
    mentor_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    db = SessionLocal()

    try:
        data = _gather_analytics_data(db, course_name, mentor_name, date_from, date_to)

        file_name = "analytics_report.xlsx"

        with pd.ExcelWriter(file_name, engine="openpyxl") as writer:
            pd.DataFrame([data["executive_summary"]]).to_excel(writer, sheet_name="Executive Summary", index=False)
            pd.DataFrame([data["session_summary"]]).to_excel(writer, sheet_name="Session Analytics", index=False)
            pd.DataFrame([data["mentor_summary"]]).to_excel(writer, sheet_name="Mentor Analytics", index=False)
            pd.DataFrame([data["batch_summary"]]).to_excel(writer, sheet_name="Batch Analytics", index=False)
            pd.DataFrame(data["batch_performance"]).to_excel(writer, sheet_name="Batch Performance", index=False)
            pd.DataFrame([data["learner_summary"]]).to_excel(writer, sheet_name="Learner Analytics", index=False)
            pd.DataFrame([data["operations_summary"]]).to_excel(writer, sheet_name="Operations Analytics", index=False)
            pd.DataFrame(data["at_risk_batches"]).to_excel(writer, sheet_name="At-Risk Batches", index=False)
            pd.DataFrame(data["top_mentors"]).to_excel(writer, sheet_name="Top Mentors", index=False)
            pd.DataFrame(data["top_batches"]).to_excel(writer, sheet_name="Top Batches", index=False)
            pd.DataFrame([data["placement_summary"]]).to_excel(writer, sheet_name="Placement (sample data)", index=False)

        return FileResponse(
            file_name,
            filename=file_name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    finally:
        db.close()


@app.get("/export-analytics-report")
def export_analytics_report(
    course_name: Optional[str] = None,
    mentor_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    db = SessionLocal()

    try:
        data = _gather_analytics_data(db, course_name, mentor_name, date_from, date_to)
        filter_desc = _filter_description(course_name, mentor_name, date_from, date_to)

        pdf_path = generate_analytics_report(data, filter_desc)

        return FileResponse(
            path=pdf_path,
            filename="Analytics_Report.pdf",
            media_type="application/pdf",
        )

    finally:
        db.close()


from sqlalchemy import func
from models.zoom_analytics import ZoomAnalytics


# ==========================================================
# Webinar List API (Dropdown)
# ==========================================================

@app.get("/webinars")
def webinars(db: Session = Depends(get_db)):

    data = db.query(ZoomAnalytics).all()

    return [
        {
            "session_id": row.session_id,
            "title": row.webinar_title,
            "mentor": row.mentor_name,
            "date": row.session_date,
            "batch": row.batch_name,
            "course": row.course_name,
        }
        for row in data
    ]


# ==========================================================
# Zoom Summary
# ==========================================================

@app.get("/zoom-summary")
def zoom_summary(db: Session = Depends(get_db)):

    total_webinars = db.query(ZoomAnalytics).count()

    registered = db.query(
        func.sum(ZoomAnalytics.registered_learners)
    ).scalar() or 0

    attended = db.query(
        func.sum(ZoomAnalytics.attended_learners)
    ).scalar() or 0

    attendance_rate = db.query(
        func.avg(ZoomAnalytics.attendance_rate)
    ).scalar() or 0

    average_watch_time = db.query(
        func.avg(ZoomAnalytics.average_watch_time)
    ).scalar() or 0

    engagement_score = db.query(
        func.avg(ZoomAnalytics.engagement_score)
    ).scalar() or 0

    session_rating = db.query(
        func.avg(ZoomAnalytics.session_rating)
    ).scalar() or 0

    recording_views = db.query(
        func.sum(ZoomAnalytics.recording_views)
    ).scalar() or 0

    return {
        "total_webinars": total_webinars,
        "registered_learners": registered,
        "attended_learners": attended,
        "attendance_rate": round(attendance_rate, 1),
        "average_watch_time": round(average_watch_time, 1),
        "engagement_score": round(engagement_score, 1),
        "session_rating": round(session_rating, 1),
        "recording_views": recording_views,
    }


# ==========================================================
# Attendance Trend
# ==========================================================

@app.get("/zoom-attendance-trend")
def zoom_attendance_trend(db: Session = Depends(get_db)):

    data = db.query(
        ZoomAnalytics.webinar_title,
        ZoomAnalytics.attendance_rate
    ).all()

    return [
        {
            "meeting": row.webinar_title,
            "attendance": row.attendance_rate,
        }
        for row in data
    ]


# ==========================================================
# Chat Analytics
# ==========================================================

@app.get("/zoom-chat-analytics")
def zoom_chat_analytics(db: Session = Depends(get_db)):

    data = db.query(
        ZoomAnalytics.webinar_title,
        ZoomAnalytics.total_chat_messages,
        ZoomAnalytics.questions_asked,
        ZoomAnalytics.raised_hands
    ).all()

    return [
        {
            "meeting": row.webinar_title,
            "messages": row.total_chat_messages,
            "questions": row.questions_asked,
            "raised_hands": row.raised_hands,
        }
        for row in data
    ]


# ==========================================================
# Poll Analytics
# ==========================================================

@app.get("/zoom-poll-analytics")
def zoom_poll_analytics(db: Session = Depends(get_db)):

    data = db.query(
        ZoomAnalytics.webinar_title,
        ZoomAnalytics.polls_conducted,
        ZoomAnalytics.poll_responses,
        ZoomAnalytics.poll_response_rate,
        ZoomAnalytics.poll_average_rating,
    ).all()

    return [
        {
            "meeting": row.webinar_title,
            "polls": row.polls_conducted,
            "responses": row.poll_responses,
            "response_rate": row.poll_response_rate,
            "rating": row.poll_average_rating,
        }
        for row in data
    ]

@app.get("/webinar-report/{session_id}")
def webinar_report(session_id: int, db: Session = Depends(get_db)):

    webinar = (
        db.query(ZoomAnalytics)
        .filter(ZoomAnalytics.session_id == session_id)
        .first()
    )

    if webinar is None:
        return {"message": "Webinar not found"}

    return {
    # Webinar Information
    "session_id": webinar.session_id,
    "title": webinar.webinar_title,
    "project": webinar.project_name,
    "course": webinar.course_name,
    "batch": webinar.batch_name,
    "mentor": webinar.mentor_name,
    "mentor_email": webinar.mentor_email,
    "date": webinar.session_date,
    "time": webinar.session_time,
    "duration": webinar.duration,
    "platform": webinar.platform,
    "status": webinar.webinar_status,

    # Attendance
    "registered_learners": webinar.registered_learners,
    "attended_learners": webinar.attended_learners,
    "attendance_rate": webinar.attendance_rate,
    "no_show_learners": webinar.no_show_learners,
    "no_show_rate": webinar.no_show_rate,
    "peak_concurrent_users": webinar.peak_concurrent_users,

    # Watch Time
    "average_watch_time": webinar.average_watch_time,
    "late_joiners": webinar.late_joiners,
    "early_exit_learners": webinar.early_exit_learners,

    # Chat
    "total_chat_messages": webinar.total_chat_messages,
    "learner_messages": webinar.learner_messages,
    "mentor_messages": webinar.mentor_messages,
    "questions_asked": webinar.questions_asked,
    "raised_hands": webinar.raised_hands,
    "emoji_reactions": webinar.emoji_reactions,

    # Q&A
    "questions_answered": webinar.questions_answered,
    "average_response_time": webinar.average_response_time,
    "resolved_questions": webinar.resolved_questions,
    "open_questions": webinar.open_questions,

    # Poll
    "polls_conducted": webinar.polls_conducted,
    "poll_responses": webinar.poll_responses,
    "poll_response_rate": webinar.poll_response_rate,
    "poll_average_rating": webinar.poll_average_rating,
    "highest_rated_poll": webinar.highest_rated_poll,

    # Feedback
    "feedback_submitted": webinar.feedback_submitted,
    "session_rating": webinar.session_rating,
    "mentor_rating": webinar.mentor_rating,
    "content_rating": webinar.content_rating,
    "audio_quality_rating": webinar.audio_quality_rating,
    "video_quality_rating": webinar.video_quality_rating,

    # Speaking
    "mentor_speaking_minutes": webinar.mentor_speaking_minutes,
    "learner_speaking_minutes": webinar.learner_speaking_minutes,
    "qa_duration": webinar.qa_duration,
    "discussion_duration": webinar.discussion_duration,

    # Recording
    "recording_available": webinar.recording_available,
    "recording_views": webinar.recording_views,
    "average_recording_watch_time": webinar.average_recording_watch_time,
    "recording_completion_rate": webinar.recording_completion_rate,

    # AI / Health
    "engagement_score": webinar.engagement_score,
    "webinar_health_score": webinar.webinar_health_score,
    "learner_satisfaction": webinar.learner_satisfaction,

    "remarks": webinar.remarks,
}


@app.get("/export-webinar-pdf/{session_id}")
def export_webinar_pdf(session_id: int, db: Session = Depends(get_db)):

    webinar = (
        db.query(ZoomAnalytics)
        .filter(ZoomAnalytics.session_id == session_id)
        .first()
    )

    if webinar is None:
        return {"message": "Webinar not found"}

    pdf_path = generate_webinar_report(webinar)

    return FileResponse(
        path=pdf_path,
        filename=f"webinar_report_{session_id}.pdf",
        media_type="application/pdf",
    )


# ==========================================================
# RESOURCE PORTAL
# ==========================================================

def _log_audit(db, action, resource_id=None, session_id=None, details=None, user=None):
    entry = AuditLog(
        user=user,
        action=action,
        resource_id=resource_id,
        session_id=session_id,
        details=details,
    )
    db.add(entry)
    db.commit()


def _log_download(db, download_type, resource_id=None, session_id=None, user_id=None):
    entry = ResourceDownloadLog(
        resource_id=resource_id,
        session_id=session_id,
        user_id=user_id,
        download_type=download_type,
    )
    db.add(entry)
    db.commit()


def _resolve_mentor_email(db, session=None, mentor_id=None, mentor_name=None):
    if session and session.mentor_email:
        return session.mentor_email

    mentor = None
    if mentor_id:
        mentor = db.query(Mentor).filter(Mentor.id == mentor_id).first()
    if not mentor and mentor_name:
        mentor = db.query(Mentor).filter(Mentor.name == mentor_name).first()

    return mentor.email if mentor else None


def _send_resource_email(
    db,
    recipient,
    email_type,
    subject,
    body,
    resource_requirement_id=None,
    session_id=None,
    mentor_id=None,
    reminder_number=None,
):
    settings = get_settings(db)

    if not settings.email_notifications_enabled:
        db.add(ResourceEmailLog(
            resource_requirement_id=resource_requirement_id,
            session_id=session_id,
            mentor_id=mentor_id,
            email=recipient or "",
            email_type=email_type,
            reminder_number=reminder_number,
            status="Skipped",
            error_message="Email notifications are paused in Settings",
        ))
        db.commit()
        return False

    if not recipient:
        db.add(ResourceEmailLog(
            resource_requirement_id=resource_requirement_id,
            session_id=session_id,
            mentor_id=mentor_id,
            email="",
            email_type=email_type,
            reminder_number=reminder_number,
            status="Failed",
            error_message="No mentor email on file",
        ))
        db.commit()
        _log_audit(db, "Email Failed", session_id=session_id, details=f"{email_type}: no recipient email")
        return False

    success, error = send_generic_email(recipient, subject, body)

    db.add(ResourceEmailLog(
        resource_requirement_id=resource_requirement_id,
        session_id=session_id,
        mentor_id=mentor_id,
        email=recipient,
        email_type=email_type,
        reminder_number=reminder_number,
        status="Sent" if success else "Failed",
        error_message=error,
    ))
    db.commit()

    if not success:
        _log_audit(db, "Email Failed", session_id=session_id, details=f"{email_type}: {error}")

    return success


def _send_reminder_for_requirement(db, requirement, session=None):
    """Shared by the manual 'Send Reminder' endpoint and (Phase 5) the scheduler.
    Returns (sent: bool, error: str | None) — error is a business-rule rejection
    (already sent today, nothing pending), not an SMTP failure."""
    if requirement.status in ("Complete", "Not Required"):
        return False, "Requirement is not pending"

    now = datetime.utcnow()

    if requirement.last_reminder_sent_at and requirement.last_reminder_sent_at.date() == now.date():
        return False, "A reminder was already sent today for this requirement"

    if session is None:
        session = db.query(SessionModel).filter(SessionModel.id == requirement.session_id).first()

    if not session:
        return False, "Session not found"

    recipient = _resolve_mentor_email(db, session, requirement.mentor_id, requirement.mentor_name)

    settings = get_settings(db)

    reminder_number = (requirement.reminder_count or 0) + 1
    is_final = reminder_number >= settings.max_reminders_before_final

    subject, body = reminder_email(session, [requirement], is_final=is_final)

    success = _send_resource_email(
        db,
        recipient,
        "Final Reminder" if is_final else "Reminder",
        subject,
        body,
        resource_requirement_id=requirement.id,
        session_id=requirement.session_id,
        mentor_id=requirement.mentor_id,
        reminder_number=reminder_number,
    )

    requirement.reminder_count = reminder_number
    requirement.last_reminder_sent_at = now
    requirement.next_reminder_at = now + timedelta(days=1)
    db.commit()

    _log_audit(
        db,
        "Reminder Sent",
        session_id=requirement.session_id,
        details=f"{requirement.resource_name} (#{reminder_number})",
    )

    return success, None


def _resource_to_dict(r):
    return {
        "id": r.id,
        "session_id": r.session_id,
        "mentor_id": r.mentor_id,
        "mentor_name": r.mentor_name,
        "batch_name": r.batch_name,
        "course_name": r.course_name,
        "session_topic": r.session_topic,
        "resource_type": r.resource_type,
        "resource_title": r.resource_title,
        "resource_url": r.resource_url,
        "file_path": r.file_path,
        "file_name": r.file_name,
        "file_size": r.file_size,
        "mime_type": r.mime_type,
        "description": r.description,
        "submitted_at": r.submitted_at,
        "created_at": r.created_at,
        "updated_at": r.updated_at,
        "status": r.status,
        "is_required": r.is_required,
        "due_at": r.due_at,
        "received_at": r.received_at,
        "delay_minutes": r.delay_minutes,
        "delay_hours": r.delay_hours,
        "reminder_count": r.reminder_count,
        "last_reminder_sent_at": r.last_reminder_sent_at,
        "next_reminder_at": r.next_reminder_at,
        "created_by": r.created_by,
        "updated_by": r.updated_by,
    }


def _requirement_to_dict(r):
    return {
        "id": r.id,
        "session_id": r.session_id,
        "mentor_id": r.mentor_id,
        "mentor_name": r.mentor_name,
        "resource_type": r.resource_type,
        "resource_name": r.resource_name,
        "is_required": r.is_required,
        "due_at": r.due_at,
        "status": r.status,
        "received_at": r.received_at,
        "reminder_count": r.reminder_count,
        "last_reminder_sent_at": r.last_reminder_sent_at,
        "next_reminder_at": r.next_reminder_at,
        "created_at": r.created_at,
        "updated_at": r.updated_at,
    }


# ----------------------------------------------------------
# Resources (submitted items)
# ----------------------------------------------------------

@app.post("/resources")
def create_resource(
    session_id: int = Form(None),
    mentor_id: int = Form(None),
    mentor_name: str = Form(None),
    batch_name: str = Form(None),
    course_name: str = Form(None),
    session_topic: str = Form(None),
    resource_type: str = Form(...),
    resource_title: str = Form(...),
    resource_url: str = Form(None),
    description: str = Form(None),
    is_required: bool = Form(True),
    created_by: str = Form(None),
    file: UploadFile = File(None),
):
    db = SessionLocal()

    try:
        existing = (
            db.query(Resource)
            .filter(
                Resource.session_id == session_id,
                Resource.mentor_name == mentor_name,
                Resource.resource_type == resource_type,
                Resource.resource_title == resource_title,
            )
            .first()
        )

        if existing:
            return {
                "success": False,
                "message": "This resource has already been submitted.",
                "resource_id": existing.id,
            }

        file_meta = {}
        if file is not None and file.filename:
            file_meta = save_file(file)

        now = datetime.utcnow()

        # Look up a matching pending requirement first, so we know the deadline
        # this submission is being measured against.
        requirement = (
            db.query(ResourceRequirement)
            .filter(
                ResourceRequirement.session_id == session_id,
                ResourceRequirement.resource_type == resource_type,
                ResourceRequirement.status.in_(["Pending", "Overdue"]),
            )
            .first()
        )

        # No requirement configured for this session/type — self-declare one so
        # this submission is still trackable (every completed session should have
        # a trackable resource requirement, whether or not Ops pre-configured it).
        if not requirement and session_id is not None:
            requirement = ResourceRequirement(
                session_id=session_id,
                mentor_id=mentor_id,
                mentor_name=mentor_name,
                resource_type=resource_type,
                resource_name=resource_title,
                is_required=is_required,
                status="Pending",
            )
            db.add(requirement)
            db.commit()
            db.refresh(requirement)

        due_at = requirement.due_at if requirement else None
        delay_minutes, delay_hours = compute_delay(due_at, now)

        new_resource = Resource(
            session_id=session_id,
            mentor_id=mentor_id,
            mentor_name=mentor_name,
            batch_name=batch_name,
            course_name=course_name,
            session_topic=session_topic,
            resource_type=resource_type,
            resource_title=resource_title,
            resource_url=resource_url,
            file_path=file_meta.get("file_path"),
            file_name=file_meta.get("file_name"),
            file_size=file_meta.get("file_size"),
            mime_type=file_meta.get("mime_type"),
            description=description,
            is_required=is_required,
            status="Submitted",
            submitted_at=now,
            due_at=due_at,
            received_at=now,
            delay_minutes=delay_minutes,
            delay_hours=delay_hours,
            created_by=created_by,
        )

        db.add(new_resource)
        db.commit()
        db.refresh(new_resource)

        if requirement:
            requirement.received_at = now
            refresh_requirement_status(requirement, now)
            db.commit()

        _log_audit(
            db,
            "Resource Created",
            resource_id=new_resource.id,
            session_id=session_id,
            user=created_by,
        )

        recipient = _resolve_mentor_email(db, mentor_id=mentor_id, mentor_name=mentor_name)
        confirm_subject, confirm_body = confirmation_email(new_resource)
        _send_resource_email(
            db,
            recipient,
            "Submission Confirmation",
            confirm_subject,
            confirm_body,
            session_id=session_id,
            mentor_id=mentor_id,
        )

        if OPS_NOTIFICATION_EMAIL:
            ops_subject, ops_body = ops_notification_email(new_resource)
            _send_resource_email(
                db,
                OPS_NOTIFICATION_EMAIL,
                "Operations Notification",
                ops_subject,
                ops_body,
                session_id=session_id,
                mentor_id=mentor_id,
            )

        return {
            "success": True,
            "message": "Resource submitted successfully",
            "id": new_resource.id,
        }

    finally:
        db.close()


@app.get("/resources")
def list_resources(
    session_id: int = None,
    mentor_id: int = None,
    mentor_name: str = None,
    batch_name: str = None,
    course_name: str = None,
    resource_type: str = None,
    status: str = None,
    search: str = None,
):
    db = SessionLocal()

    try:
        query = db.query(Resource)

        if session_id is not None:
            query = query.filter(Resource.session_id == session_id)
        if mentor_id is not None:
            query = query.filter(Resource.mentor_id == mentor_id)
        if mentor_name:
            query = query.filter(Resource.mentor_name == mentor_name)
        if batch_name:
            query = query.filter(Resource.batch_name == batch_name)
        if course_name:
            query = query.filter(Resource.course_name == course_name)
        if resource_type:
            query = query.filter(Resource.resource_type == resource_type)
        if status:
            query = query.filter(Resource.status == status)
        if search:
            like = f"%{search}%"
            query = query.filter(
                (Resource.resource_title.ilike(like))
                | (Resource.session_topic.ilike(like))
                | (Resource.mentor_name.ilike(like))
                | (Resource.batch_name.ilike(like))
                | (Resource.course_name.ilike(like))
            )

        resources = query.order_by(Resource.created_at.desc()).all()

        return [_resource_to_dict(r) for r in resources]

    finally:
        db.close()


@app.get("/resources/pending")
def get_pending_resources(mentor_name: str = None, batch_name: str = None):
    db = SessionLocal()

    try:
        rows = list_pending_requirements(db)

        if mentor_name:
            rows = [r for r in rows if r["mentor_name"] == mentor_name]
        if batch_name:
            rows = [r for r in rows if r["batch_name"] == batch_name]

        return rows

    finally:
        db.close()


@app.get("/resources/export")
def export_resources(format: str = "excel"):
    db = SessionLocal()

    try:
        rows = build_export_rows(db)
        df = pd.DataFrame(rows)

        if format == "csv":
            file_name = "resource_report.csv"
            df.to_csv(file_name, index=False)
            media_type = "text/csv"
        else:
            file_name = "resource_report.xlsx"
            df.to_excel(file_name, index=False)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        return FileResponse(file_name, filename=file_name, media_type=media_type)

    finally:
        db.close()


@app.get("/resources/{resource_id}")
def get_resource(resource_id: int):
    db = SessionLocal()

    try:
        r = db.query(Resource).filter(Resource.id == resource_id).first()

        if not r:
            return {"message": "Resource not found"}

        return _resource_to_dict(r)

    finally:
        db.close()


@app.put("/resources/{resource_id}")
def update_resource(resource_id: int, data: ResourceUpdate):
    db = SessionLocal()

    try:
        r = db.query(Resource).filter(Resource.id == resource_id).first()

        if not r:
            return {"message": "Resource not found"}

        if data.resource_title is not None:
            r.resource_title = data.resource_title
        if data.resource_url is not None:
            r.resource_url = data.resource_url
        if data.description is not None:
            r.description = data.description
        if data.status is not None:
            r.status = data.status

        r.updated_by = data.updated_by
        r.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(r)

        _log_audit(
            db,
            "Resource Updated",
            resource_id=r.id,
            session_id=r.session_id,
            user=data.updated_by,
        )

        return {"message": "Resource updated successfully"}

    finally:
        db.close()


@app.delete("/resources/{resource_id}")
def delete_resource(resource_id: int):
    db = SessionLocal()

    try:
        r = db.query(Resource).filter(Resource.id == resource_id).first()

        if not r:
            return {"message": "Resource not found"}

        session_id = r.session_id
        db.delete(r)
        db.commit()

        _log_audit(db, "Resource Deleted", resource_id=resource_id, session_id=session_id)

        return {"message": "Resource deleted successfully"}

    finally:
        db.close()


# ----------------------------------------------------------
# Resource Requirements (what's required for a session)
# ----------------------------------------------------------

@app.post("/resource-requirements")
def create_resource_requirements(data: ResourceRequirementCreate):
    db = SessionLocal()

    try:
        created = []

        settings = get_settings(db)
        default_due_at = data.due_at or (datetime.utcnow() + timedelta(hours=settings.resource_default_deadline_hours))

        for item in data.requirements:
            existing = (
                db.query(ResourceRequirement)
                .filter(
                    ResourceRequirement.session_id == data.session_id,
                    ResourceRequirement.resource_type == item.resource_type,
                )
                .first()
            )

            if existing:
                continue

            requirement = ResourceRequirement(
                session_id=data.session_id,
                mentor_id=data.mentor_id,
                mentor_name=data.mentor_name,
                resource_type=item.resource_type,
                resource_name=item.resource_name,
                is_required=item.is_required,
                due_at=default_due_at,
                status="Pending",
            )
            db.add(requirement)
            created.append(requirement)

        db.commit()

        for r in created:
            db.refresh(r)
            _log_audit(
                db,
                "Requirement Created",
                session_id=r.session_id,
                details=r.resource_name,
            )

        if created:
            session = db.query(SessionModel).filter(SessionModel.id == data.session_id).first()

            if session:
                recipient = _resolve_mentor_email(db, session, data.mentor_id, data.mentor_name)
                subject, body = initial_request_email(session, created)
                _send_resource_email(
                    db,
                    recipient,
                    "Initial Resource Request",
                    subject,
                    body,
                    session_id=data.session_id,
                    mentor_id=data.mentor_id,
                )

        return {
            "message": f"{len(created)} requirement(s) created",
            "created_count": len(created),
            "ids": [r.id for r in created],
        }

    finally:
        db.close()


@app.get("/resource-requirements")
def list_resource_requirements(
    session_id: int = None,
    mentor_id: int = None,
    mentor_name: str = None,
    status: str = None,
):
    db = SessionLocal()

    try:
        query = db.query(ResourceRequirement)

        if session_id is not None:
            query = query.filter(ResourceRequirement.session_id == session_id)
        if mentor_id is not None:
            query = query.filter(ResourceRequirement.mentor_id == mentor_id)
        if mentor_name:
            query = query.filter(ResourceRequirement.mentor_name == mentor_name)
        if status:
            query = query.filter(ResourceRequirement.status == status)

        requirements = query.order_by(ResourceRequirement.due_at.asc()).all()

        return [_requirement_to_dict(r) for r in requirements]

    finally:
        db.close()


@app.get("/resource-requirements/{requirement_id}")
def get_resource_requirement(requirement_id: int):
    db = SessionLocal()

    try:
        r = (
            db.query(ResourceRequirement)
            .filter(ResourceRequirement.id == requirement_id)
            .first()
        )

        if not r:
            return {"message": "Requirement not found"}

        return _requirement_to_dict(r)

    finally:
        db.close()


@app.put("/resource-requirements/{requirement_id}/status")
def update_resource_requirement_status(requirement_id: int, data: ResourceRequirementStatusUpdate):
    db = SessionLocal()

    try:
        r = (
            db.query(ResourceRequirement)
            .filter(ResourceRequirement.id == requirement_id)
            .first()
        )

        if not r:
            return {"message": "Requirement not found"}

        r.status = data.status
        r.updated_at = datetime.utcnow()

        if data.status == "Complete" and not r.received_at:
            r.received_at = datetime.utcnow()

        db.commit()

        if data.status == "Complete":
            action = "Requirement Completed"
        elif data.status == "Not Required":
            action = "Requirement Closed"
        else:
            action = "Requirement Updated"

        _log_audit(
            db,
            action,
            session_id=r.session_id,
            details=f"{r.resource_name} -> {data.status}",
            user=data.updated_by,
        )

        return {"message": "Requirement status updated successfully"}

    finally:
        db.close()


@app.post("/resource-requirements/{requirement_id}/send-reminder")
def send_manual_reminder(requirement_id: int):
    db = SessionLocal()

    try:
        r = (
            db.query(ResourceRequirement)
            .filter(ResourceRequirement.id == requirement_id)
            .first()
        )

        if not r:
            return {"message": "Requirement not found"}

        sent, error = _send_reminder_for_requirement(db, r)

        if error:
            return {"success": False, "message": error}

        return {
            "success": sent,
            "message": "Reminder sent successfully" if sent else "Reminder logged but email delivery failed",
        }

    finally:
        db.close()


@app.delete("/resource-requirements/{requirement_id}")
def delete_resource_requirement(requirement_id: int):
    db = SessionLocal()

    try:
        r = (
            db.query(ResourceRequirement)
            .filter(ResourceRequirement.id == requirement_id)
            .first()
        )

        if not r:
            return {"message": "Requirement not found"}

        session_id = r.session_id
        db.delete(r)
        db.commit()

        _log_audit(db, "Requirement Closed", session_id=session_id, details="deleted")

        return {"message": "Requirement deleted successfully"}

    finally:
        db.close()


# ----------------------------------------------------------
# Resource Tracking (cross-session view)
# ----------------------------------------------------------

@app.get("/resource-tracking")
def resource_tracking(
    mentor_name: str = None,
    batch_name: str = None,
    course_name: str = None,
    status: str = None,
):
    db = SessionLocal()

    try:
        rows = build_tracking_table(db)

        if mentor_name:
            rows = [r for r in rows if r["mentor_name"] == mentor_name]
        if batch_name:
            rows = [r for r in rows if r["batch_name"] == batch_name]
        if course_name:
            rows = [r for r in rows if r["course_name"] == course_name]
        if status:
            rows = [r for r in rows if r["status"] == status]

        return rows

    finally:
        db.close()


@app.get("/resource-tracking/{session_id}")
def resource_tracking_detail(session_id: int):
    db = SessionLocal()

    try:
        detail = session_resource_detail(db, session_id)

        if not detail:
            return {"message": "Session not found"}

        session = detail["session"]

        return {
            "session": {
                "id": session.id,
                "topic": session.topic,
                "course_name": session.course_name,
                "batch_name": session.batch_name,
                "mentor_name": session.mentor_name,
                "mentor_email": session.mentor_email,
                "session_date": session.session_date,
                "session_time": session.session_time,
                "status": session.status,
            },
            "status": detail["status"],
            "required_count": detail["required_count"],
            "received_count": detail["received_count"],
            "missing_count": detail["missing_count"],
            "missing_resources": detail["missing_resources"],
            "due_at": detail["due_at"],
            "received_at": detail["received_at"],
            "delay_hours": detail["delay_hours"],
            "reminder_count": detail["reminder_count"],
            "requirements": [_requirement_to_dict(r) for r in detail["requirements"]],
            "resources": [_resource_to_dict(r) for r in detail["resources"]],
            "emails": [
                {
                    "id": e.id,
                    "email": e.email,
                    "email_type": e.email_type,
                    "sent_at": e.sent_at,
                    "reminder_number": e.reminder_number,
                    "status": e.status,
                    "error_message": e.error_message,
                }
                for e in detail["emails"]
            ],
        }

    finally:
        db.close()


# ----------------------------------------------------------
# Resource Download / Preview / LMS Package
# ----------------------------------------------------------

@app.get("/resources/{resource_id}/download")
def download_resource(resource_id: int, user_id: str = None):
    db = SessionLocal()

    try:
        r = db.query(Resource).filter(Resource.id == resource_id).first()

        if not r:
            return {"message": "Resource not found"}

        if not r.file_path or not os.path.exists(r.file_path):
            return {"message": "This resource has no downloadable file — open the URL instead."}

        _log_download(db, "Individual", resource_id=r.id, session_id=r.session_id, user_id=user_id)
        _log_audit(db, "Resource Downloaded", resource_id=r.id, session_id=r.session_id, user=user_id)

        return FileResponse(
            path=r.file_path,
            filename=r.file_name or os.path.basename(r.file_path),
            media_type=r.mime_type or "application/octet-stream",
        )

    finally:
        db.close()


@app.get("/resources/{resource_id}/preview")
def preview_resource(resource_id: int, user_id: str = None):
    db = SessionLocal()

    try:
        r = db.query(Resource).filter(Resource.id == resource_id).first()

        if not r:
            return {"message": "Resource not found"}

        if not r.file_path or not os.path.exists(r.file_path):
            return {"message": "This resource has no previewable file — open the URL instead."}

        _log_download(db, "Preview", resource_id=r.id, session_id=r.session_id, user_id=user_id)

        return FileResponse(
            path=r.file_path,
            media_type=r.mime_type or "application/octet-stream",
            headers={"Content-Disposition": f'inline; filename="{r.file_name}"'},
        )

    finally:
        db.close()


@app.get("/resources/{resource_id}/download-lms")
def download_resource_for_lms(resource_id: int, user_id: str = None):
    db = SessionLocal()

    try:
        r = db.query(Resource).filter(Resource.id == resource_id).first()

        if not r:
            return {"message": "Resource not found"}

        if not r.file_path or not os.path.exists(r.file_path):
            return {"message": "This resource has no downloadable file — open the URL instead."}

        _log_download(db, "Individual", resource_id=r.id, session_id=r.session_id, user_id=user_id)
        _log_audit(db, "Resource Downloaded", resource_id=r.id, session_id=r.session_id, user=user_id, details="LMS filename")

        return FileResponse(
            path=r.file_path,
            filename=lms_filename(r),
            media_type=r.mime_type or "application/octet-stream",
        )

    finally:
        db.close()


@app.get("/sessions/{session_id}/resources/lms-package")
def download_lms_package(session_id: int, user_id: str = None):
    db = SessionLocal()

    try:
        package = build_lms_package(db, session_id)

        if not package:
            return {"message": "No resources found for this session."}

        zip_path, zip_name = package

        _log_download(db, "LMS Package", session_id=session_id, user_id=user_id)
        _log_audit(db, "LMS Package Downloaded", session_id=session_id, user=user_id)

        return FileResponse(
            path=zip_path,
            filename=zip_name,
            media_type="application/zip",
        )

    finally:
        db.close()


# ----------------------------------------------------------
# Reminder Scheduler
# ----------------------------------------------------------

@app.get("/resource-scheduler/status")
def resource_scheduler_status(db: Session = Depends(get_db)):
    settings = get_settings(db)
    return {
        "enabled": settings.reminder_scheduler_enabled,
        "interval_hours": REMINDER_INTERVAL_HOURS,
    }


@app.post("/resource-scheduler/run")
def resource_scheduler_run(dry_run: bool = True):
    return run_reminder_check(dry_run=dry_run)


# ----------------------------------------------------------
# Resource Analytics
# ----------------------------------------------------------

@app.get("/resource-analytics")
def resource_analytics():
    db = SessionLocal()

    try:
        return compute_resource_analytics(db)

    finally:
        db.close()


@app.get("/resource-analytics/mentors")
def resource_analytics_mentors():
    db = SessionLocal()

    try:
        return compute_mentor_performance(db)

    finally:
        db.close()


@app.get("/resource-analytics/mentor-heatmap")
def resource_analytics_mentor_heatmap(weeks: int = 4):
    db = SessionLocal()

    try:
        return compute_mentor_heatmap(db, weeks=weeks)

    finally:
        db.close()
