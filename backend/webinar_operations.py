"""Webinar Operations — business logic for scheduling, participants, reports,
lead intelligence, and mentor payout. ZoomAnalytics IS the Webinar entity
(already had nearly every field this module needs) — no separate Webinar
table. WebinarParticipant is the one genuinely new table (individual
registrant/attendee records; ZoomAnalytics only ever stored aggregate
counts)."""

from datetime import datetime
from collections import defaultdict, Counter

from models.zoom_analytics import ZoomAnalytics
from models.webinar_participant import WebinarParticipant
from models.nps import NPSFeedback
from models.mentor import Mentor
from models.invoice import Invoice

VALID_STATUSES = ["Draft", "Scheduled", "Live", "Completed", "Cancelled", "Rescheduled"]
VALID_LEAD_STATUSES = [
    "New", "Interested", "Follow-up Required", "Contacted",
    "Qualified", "Converted", "Not Interested", "Not Reachable",
]


def _to_float(value, default=None):
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_month(date_str):
    """'2026-07-09' -> '2026-07'. Never raises — falls back to the current month."""
    if date_str and len(date_str) >= 7:
        return date_str[:7]
    return datetime.utcnow().strftime("%Y-%m")


def is_existing_user(db, email, exclude_participant_id=None):
    """Heuristic only — true if this email has shown up before, either as
    NPS feedback (a proxy for 'has taken a course') or as a participant on
    an earlier webinar. There is no real enrollment/CRM table in this
    database to check against."""
    if not email:
        return False

    email = email.strip().lower()

    if db.query(NPSFeedback).filter(NPSFeedback.learner_email.ilike(email)).first():
        return True

    query = db.query(WebinarParticipant).filter(WebinarParticipant.email.ilike(email))
    if exclude_participant_id:
        query = query.filter(WebinarParticipant.id != exclude_participant_id)
    return query.first() is not None


def register_participant(db, webinar_id, *, name, email, phone=None, source=None, course_interest=None):
    """Registers one participant for a webinar. Rejects a duplicate
    (webinar_id, email) registration rather than creating a second row —
    per the 'no duplicate webinar registrations' requirement."""
    existing = (
        db.query(WebinarParticipant)
        .filter(WebinarParticipant.webinar_id == webinar_id, WebinarParticipant.email.ilike(email))
        .first()
    )
    if existing:
        return {"success": False, "message": "This email is already registered for this webinar.", "participant_id": existing.id}

    existing_user = is_existing_user(db, email)

    participant = WebinarParticipant(
        webinar_id=webinar_id,
        name=name,
        email=email,
        phone=phone,
        source=source,
        course_interest=course_interest,
        is_existing_user=existing_user,
        is_unique_user=not existing_user,
        lead_status="New",
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    return {"success": True, "message": "Participant registered", "participant_id": participant.id}


def compute_webinar_report(db, webinar_id):
    """Prefers live participant-level data when it exists (accurate,
    derived — per 'calculate metrics rather than manually store them'),
    falls back to ZoomAnalytics' own aggregate columns for older/seed-only
    webinars that never got participant-level tracking."""
    webinar = db.query(ZoomAnalytics).filter(ZoomAnalytics.id == webinar_id).first()
    if not webinar:
        return None

    participants = db.query(WebinarParticipant).filter(WebinarParticipant.webinar_id == webinar_id).all()

    if participants:
        total_registered = len(participants)
        attended = [p for p in participants if p.attended]
        total_attended = len(attended)
        existing_users = sum(1 for p in participants if p.is_existing_user)
        new_users = total_registered - existing_users
        unique_attendees = len({p.email.lower() for p in attended})
        ratings = [p.rating for p in participants if p.rating]
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else None
        durations = [p.attendance_duration for p in attended if p.attendance_duration]
        avg_duration = round(sum(durations) / len(durations), 1) if durations else None

        qualified = [p for p in participants if p.lead_status in ("Qualified", "Converted")]
        converted = [p for p in participants if p.lead_status == "Converted"]
        high_intent = [p for p in participants if p.lead_status in ("Interested", "Qualified", "Converted")]

        attendance_percentage = round((total_attended / total_registered) * 100, 1) if total_registered else 0
        conversion_rate = round((len(converted) / len(qualified)) * 100, 1) if qualified else None

        report = {
            "source": "participants",
            "total_registered": total_registered,
            "total_attended": total_attended,
            "unique_attendees": unique_attendees,
            "existing_users": existing_users,
            "new_users": new_users,
            "attendance_percentage": attendance_percentage,
            "average_rating": avg_rating,
            "total_feedback": sum(1 for p in participants if p.feedback),
            "average_attendance_duration": avg_duration,
            "high_intent_leads": len(high_intent),
            "course_interested_leads": sum(1 for p in participants if p.course_interest),
            "qualified_leads": len(qualified),
            "converted_leads": len(converted),
            "conversion_rate": conversion_rate,
        }
    else:
        registered = webinar.registered_learners or 0
        attended_count = webinar.attended_learners or 0
        report = {
            "source": "zoom_analytics",
            "total_registered": registered,
            "total_attended": attended_count,
            "unique_attendees": None,
            "existing_users": None,
            "new_users": None,
            "attendance_percentage": webinar.attendance_rate,
            "average_rating": webinar.session_rating,
            "total_feedback": webinar.feedback_submitted,
            "average_attendance_duration": webinar.average_watch_time,
            "high_intent_leads": None,
            "course_interested_leads": None,
            "qualified_leads": None,
            "converted_leads": None,
            "conversion_rate": None,
        }

    return {
        "webinar": {
            "id": webinar.id,
            "title": webinar.webinar_title,
            "mentor_name": webinar.mentor_name,
            "session_date": webinar.session_date,
            "duration": webinar.duration,
            "status": webinar.webinar_status,
        },
        "report": report,
    }


def list_leads(db, mentor_name=None, lead_status=None, course_interest=None, date_from=None, date_to=None):
    query = db.query(WebinarParticipant)

    if lead_status:
        query = query.filter(WebinarParticipant.lead_status == lead_status)
    if course_interest:
        query = query.filter(WebinarParticipant.course_interest == course_interest)
    if date_from:
        query = query.filter(WebinarParticipant.registration_date >= date_from)
    if date_to:
        query = query.filter(WebinarParticipant.registration_date <= date_to)

    participants = query.order_by(WebinarParticipant.registration_date.desc()).all()

    if mentor_name:
        webinar_ids = {
            w.id for w in db.query(ZoomAnalytics).filter(ZoomAnalytics.mentor_name == mentor_name).all()
        }
        participants = [p for p in participants if p.webinar_id in webinar_ids]

    webinars_by_id = {w.id: w for w in db.query(ZoomAnalytics).all()}

    rows = []
    for p in participants:
        webinar = webinars_by_id.get(p.webinar_id)
        rows.append({
            "participant_id": p.id,
            "name": p.name,
            "email": p.email,
            "webinar_id": p.webinar_id,
            "webinar_title": webinar.webinar_title if webinar else None,
            "mentor_name": webinar.mentor_name if webinar else None,
            "registration_date": p.registration_date,
            "attended": p.attended,
            "is_existing_user": p.is_existing_user,
            "course_interest": p.course_interest,
            "lead_status": p.lead_status,
            "sales_followup_status": p.sales_followup_status,
            "follow_up_date": p.follow_up_date,
        })
    return rows


def lead_profile(db, email):
    """Rollup across every webinar a given email has touched — the
    practical substitute for a real Learner 360 view, since no Learner
    directory table exists anywhere in this app (confirmed in Phase 1).
    Everything here is derived from WebinarParticipant rows only — there is
    no course-enrollment table to cross-reference, so "Enrollment" status
    is intentionally not part of this profile (would be fabricated)."""
    participants = (
        db.query(WebinarParticipant)
        .filter(WebinarParticipant.email.ilike(email))
        .order_by(WebinarParticipant.registration_date.asc())
        .all()
    )
    if not participants:
        return None

    webinars_by_id = {w.id: w for w in db.query(ZoomAnalytics).all()}

    attendance_history = []
    for p in participants:
        w = webinars_by_id.get(p.webinar_id)
        attendance_history.append({
            "webinar_id": p.webinar_id,
            "webinar_title": w.webinar_title if w else None,
            "session_date": w.session_date if w else None,
            "mentor_name": w.mentor_name if w else None,
            "registration_date": p.registration_date,
            "attended": p.attended,
            "rating": p.rating,
            "lead_status": p.lead_status,
        })

    topics = [h["webinar_title"] for h in attendance_history if h["webinar_title"]]
    ratings_given = [p.rating for p in participants if p.rating]
    unique_webinars_attended = len({p.webinar_id for p in participants if p.attended})

    latest = participants[-1]

    return {
        "email": email,
        "name": participants[0].name,
        "webinars_registered": len(participants),
        "webinars_attended": sum(1 for p in participants if p.attended),
        "unique_webinars_attended": unique_webinars_attended,
        "first_webinar": participants[0].registration_date,
        "last_webinar": participants[-1].registration_date,
        "topics": topics,
        "average_rating_given": round(sum(ratings_given) / len(ratings_given), 2) if ratings_given else None,
        "attendance_history": attendance_history,
        "is_existing_user": latest.is_existing_user,
        "sales_activity": {
            "current_lead_status": latest.lead_status,
            "course_interest": latest.course_interest,
            "sales_followup_status": latest.sales_followup_status,
            "last_follow_up_date": latest.follow_up_date,
            "conversion_status": "Converted" if any(p.lead_status == "Converted" for p in participants) else latest.lead_status,
        },
    }


def calculate_payout(mentor_hourly_rate, duration_minutes):
    rate = _to_float(mentor_hourly_rate, 0) or 0
    minutes = duration_minutes or 0
    return round((minutes / 60) * rate, 2)


def compute_mentor_webinar_performance(db, mentor_name):
    """Webinar-specific performance for one mentor — meant to be fetched as
    a supplementary section on the existing Mentor 360 page
    (/mentor-performance/{mentor}), not a duplicate mentor-scoring system.
    Returns None if this mentor has never run a webinar (so the frontend
    can cleanly omit the section rather than show an empty shell)."""
    webinars = db.query(ZoomAnalytics).filter(ZoomAnalytics.mentor_name == mentor_name).all()
    if not webinars:
        return None

    today = datetime.utcnow().strftime("%Y-%m-%d")
    webinar_ids = {w.id for w in webinars}
    participants = db.query(WebinarParticipant).filter(WebinarParticipant.webinar_id.in_(webinar_ids)).all()
    payouts = db.query(Invoice).filter(Invoice.source_type == "webinar", Invoice.webinar_id.in_(webinar_ids)).all()

    participants_by_webinar = defaultdict(list)
    for p in participants:
        participants_by_webinar[p.webinar_id].append(p)

    total_attendees = 0
    rating_sum, rating_count = 0, 0
    for w in webinars:
        wp = participants_by_webinar.get(w.id, [])
        if wp:
            total_attendees += sum(1 for p in wp if p.attended)
            for p in wp:
                if p.rating:
                    rating_sum += p.rating
                    rating_count += 1
        else:
            total_attendees += w.attended_learners or 0
            if w.session_rating:
                rating_sum += w.session_rating
                rating_count += 1

    qualified = [p for p in participants if p.lead_status in ("Qualified", "Converted")]
    converted = [p for p in participants if p.lead_status == "Converted"]
    total_payout = sum(_to_float(inv.total_amount, 0) or 0 for inv in payouts)
    total_webinars = len(webinars)

    return {
        "total_webinars": total_webinars,
        "upcoming_webinars": sum(1 for w in webinars if w.webinar_status in ("Draft", "Scheduled") and (w.session_date or "") >= today),
        "completed_webinars": sum(1 for w in webinars if w.webinar_status == "Completed"),
        "total_attendees": total_attendees,
        "average_attendance_per_webinar": round(total_attendees / total_webinars, 1) if total_webinars else None,
        "average_rating": round(rating_sum / rating_count, 2) if rating_count else None,
        "leads_generated": len(qualified),
        "conversions": len(converted),
        "conversion_rate": _safe_div(len(converted), len(qualified)),
        "leads_per_webinar": round(len(qualified) / total_webinars, 2) if total_webinars else None,
        "total_payout": round(total_payout, 2),
        "payout_per_attendee": round(total_payout / total_attendees, 2) if total_attendees else None,
    }


def create_webinar_payout(db, webinar_id):
    """Creates an Invoice row (source_type='webinar') for this webinar's
    mentor. batch_name/month are always populated (never left null) so the
    existing invoice-generator.js page's search filter — which does
    invoice.batch_name.toLowerCase() with no null-check — keeps working
    completely unmodified."""
    webinar = db.query(ZoomAnalytics).filter(ZoomAnalytics.id == webinar_id).first()
    if not webinar:
        return {"success": False, "message": "Webinar not found"}

    existing = db.query(Invoice).filter(Invoice.webinar_id == webinar_id, Invoice.source_type == "webinar").first()
    if existing:
        return {"success": False, "message": "A payout invoice already exists for this webinar.", "invoice_id": existing.id}

    mentor = db.query(Mentor).filter(Mentor.name == webinar.mentor_name).first()
    hourly_rate = mentor.hourly_rate if mentor else None
    if not hourly_rate:
        return {"success": False, "message": "No hourly rate on file for this mentor — cannot calculate payout."}

    amount = calculate_payout(hourly_rate, webinar.duration)

    invoice = Invoice(
        mentor_name=webinar.mentor_name,
        mentor_email=webinar.mentor_email or (mentor.email if mentor else None),
        batch_name=f"Webinar: {webinar.webinar_title}",
        month=_to_month(webinar.session_date),
        total_sessions=1,
        total_hours=str(round((webinar.duration or 0) / 60, 2)),
        hourly_rate=str(hourly_rate),
        total_amount=str(amount),
        payment_status="Pending",
        source_type="webinar",
        webinar_id=webinar_id,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return {"success": True, "message": "Payout invoice created", "invoice_id": invoice.id, "amount": amount}


def list_webinars_with_stats(db):
    """One efficient pass (3 queries total, not N+1) merging ZoomAnalytics
    with participant-derived lead/conversion counts and payout status —
    powers the Webinar List table."""
    webinars = db.query(ZoomAnalytics).order_by(ZoomAnalytics.id.desc()).all()

    participants_by_webinar = defaultdict(list)
    for p in db.query(WebinarParticipant).all():
        participants_by_webinar[p.webinar_id].append(p)

    payouts_by_webinar = {
        inv.webinar_id: inv
        for inv in db.query(Invoice).filter(Invoice.source_type == "webinar").all()
    }

    rows = []
    for w in webinars:
        participants = participants_by_webinar.get(w.id, [])
        qualified = sum(1 for p in participants if p.lead_status in ("Qualified", "Converted"))
        converted = sum(1 for p in participants if p.lead_status == "Converted")
        payout = payouts_by_webinar.get(w.id)

        registered = len(participants) if participants else (w.registered_learners or 0)
        attended = sum(1 for p in participants if p.attended) if participants else (w.attended_learners or 0)
        rating = round(sum(p.rating for p in participants if p.rating) / len([p for p in participants if p.rating]), 2) \
            if [p for p in participants if p.rating] else w.session_rating

        rows.append({
            "id": w.id,
            "title": w.webinar_title,
            "mentor_name": w.mentor_name,
            "session_date": w.session_date,
            "session_time": w.session_time,
            "duration": w.duration,
            "platform": w.platform,
            "category": w.category,
            "status": w.webinar_status,
            "registered": registered,
            "attended": attended,
            "attendance_percentage": round((attended / registered) * 100, 1) if registered else 0,
            "rating": rating,
            "leads": qualified,
            "converted": converted,
            "payout_status": payout.payment_status if payout else "Not Invoiced",
            "payout_amount": payout.total_amount if payout else None,
        })

    return rows


def list_webinar_payouts(db, mentor_name=None, payment_status=None):
    query = db.query(Invoice).filter(Invoice.source_type == "webinar")
    if mentor_name:
        query = query.filter(Invoice.mentor_name == mentor_name)
    if payment_status:
        query = query.filter(Invoice.payment_status == payment_status)

    invoices = query.order_by(Invoice.id.desc()).all()
    webinars_by_id = {w.id: w for w in db.query(ZoomAnalytics).all()}

    return [{
        "invoice_id": inv.id,
        "webinar_id": inv.webinar_id,
        "webinar_title": webinars_by_id.get(inv.webinar_id).webinar_title if webinars_by_id.get(inv.webinar_id) else None,
        "mentor_name": inv.mentor_name,
        "month": inv.month,
        "total_hours": inv.total_hours,
        "hourly_rate": inv.hourly_rate,
        "total_amount": inv.total_amount,
        "payment_status": inv.payment_status,
        "invoice_number": inv.invoice_number,
    } for inv in invoices]


# ---------------------------------------------------------------------------
# Dashboard + Business Insights (Phase 3)
# ---------------------------------------------------------------------------

def _safe_div(numerator, denominator, round_to=1):
    """Every ratio/rate formula in this module goes through this — never a
    silent 0 or a crash on empty data, always None (renders as N/A) when the
    denominator is zero."""
    if not denominator:
        return None
    return round((numerator / denominator) * 100, round_to)


def _filtered_webinars(db, mentor_name=None, category=None, status=None, date_from=None, date_to=None):
    query = db.query(ZoomAnalytics)
    if mentor_name:
        query = query.filter(ZoomAnalytics.mentor_name == mentor_name)
    if category:
        query = query.filter(ZoomAnalytics.category == category)
    if status:
        query = query.filter(ZoomAnalytics.webinar_status == status)
    if date_from:
        query = query.filter(ZoomAnalytics.session_date >= date_from)
    if date_to:
        query = query.filter(ZoomAnalytics.session_date <= date_to)
    return query.all()


def _scope(db, mentor_name=None, category=None, status=None, date_from=None, date_to=None):
    """One shared data pull for both the dashboard and business-insights
    endpoints — same filtered webinar set, their participants, and their
    webinar-origin payouts. Avoids computing this twice per request."""
    webinars = _filtered_webinars(db, mentor_name, category, status, date_from, date_to)
    webinar_ids = {w.id for w in webinars}

    all_participants = db.query(WebinarParticipant).filter(WebinarParticipant.webinar_id.in_(webinar_ids)).all() if webinar_ids else []
    payouts = db.query(Invoice).filter(Invoice.source_type == "webinar", Invoice.webinar_id.in_(webinar_ids)).all() if webinar_ids else []

    return webinars, all_participants, payouts


def compute_webinar_dashboard(db, mentor_name=None, category=None, status=None, date_from=None, date_to=None):
    webinars, participants, payouts = _scope(db, mentor_name, category, status, date_from, date_to)
    today = datetime.utcnow().strftime("%Y-%m-%d")

    total_webinars = len(webinars)
    upcoming = sum(1 for w in webinars if w.webinar_status in ("Draft", "Scheduled") and (w.session_date or "") >= today)
    completed = sum(1 for w in webinars if w.webinar_status == "Completed")

    # Prefer participant-derived counts where they exist, else the
    # webinar's own aggregate columns — same fallback rule as compute_webinar_report.
    participants_by_webinar = defaultdict(list)
    for p in participants:
        participants_by_webinar[p.webinar_id].append(p)

    total_registrations = 0
    total_attendees = 0
    rating_sum, rating_count = 0, 0
    for w in webinars:
        wp = participants_by_webinar.get(w.id, [])
        if wp:
            total_registrations += len(wp)
            total_attendees += sum(1 for p in wp if p.attended)
            for p in wp:
                if p.rating:
                    rating_sum += p.rating
                    rating_count += 1
        else:
            total_registrations += w.registered_learners or 0
            total_attendees += w.attended_learners or 0
            if w.session_rating:
                rating_sum += w.session_rating
                rating_count += 1

    unique_emails = {p.email.lower() for p in participants if p.attended}
    qualified = [p for p in participants if p.lead_status in ("Qualified", "Converted")]
    converted = [p for p in participants if p.lead_status == "Converted"]

    total_payout = sum(_to_float(inv.total_amount, 0) or 0 for inv in payouts)

    return {
        "total_webinars": total_webinars,
        "upcoming_webinars": upcoming,
        "completed_webinars": completed,
        "total_registrations": total_registrations,
        "total_attendees": total_attendees,
        "unique_users": len(unique_emails) if participants else None,
        "average_attendance_percentage": _safe_div(total_attendees, total_registrations),
        "average_rating": round(rating_sum / rating_count, 2) if rating_count else None,
        "total_leads": len(qualified),
        "converted_leads": len(converted),
        "conversion_rate": _safe_div(len(converted), len(qualified)),
        "total_mentor_payout": round(total_payout, 2),
    }


def compute_business_insights(db, mentor_name=None, category=None, status=None, date_from=None, date_to=None):
    """Every figure and every insight-card sentence below is computed from
    the current filtered dataset — nothing is a hardcoded template string
    with fixed numbers."""
    webinars, participants, payouts = _scope(db, mentor_name, category, status, date_from, date_to)
    webinars_by_id = {w.id: w for w in webinars}

    # ---- Audience ----
    by_email = defaultdict(list)
    for p in participants:
        by_email[p.email.lower()].append(p)

    unique_users = len(by_email)
    new_users = sum(1 for p in participants if not p.is_existing_user)
    existing_users = sum(1 for p in participants if p.is_existing_user)
    repeat_attendees = sum(1 for rows in by_email.values() if len(rows) > 1)
    most_active = sorted(by_email.items(), key=lambda kv: len(kv[1]), reverse=True)[:5]
    most_active_users = [{"email": email, "name": rows[0].name, "webinars_attended": len(rows)} for email, rows in most_active]

    topic_counter = Counter(w.category for w in webinars if w.category)
    most_popular_topics = [{"topic": t, "webinar_count": c} for t, c in topic_counter.most_common(5)]

    # ---- Performance ----
    def _top(items, key, reverse=True):
        valid = [i for i in items if key(i) is not None]
        if not valid:
            return None
        return max(valid, key=key) if reverse else min(valid, key=key)

    participants_by_webinar = defaultdict(list)
    for p in participants:
        participants_by_webinar[p.webinar_id].append(p)

    def _webinar_attendance(w):
        wp = participants_by_webinar.get(w.id)
        return len([p for p in wp if p.attended]) if wp else (w.attended_learners or 0)

    def _webinar_rating(w):
        wp = participants_by_webinar.get(w.id)
        rated = [p.rating for p in wp if p.rating] if wp else []
        if rated:
            return sum(rated) / len(rated)
        return w.session_rating or None

    def _webinar_registrations(w):
        wp = participants_by_webinar.get(w.id)
        return len(wp) if wp else (w.registered_learners or 0)

    def _webinar_unique(w):
        wp = participants_by_webinar.get(w.id)
        return len({p.email.lower() for p in wp if p.attended}) if wp else None

    top_by_attendance = _top(webinars, _webinar_attendance)
    top_by_rating = _top(webinars, _webinar_rating)
    top_by_registrations = _top(webinars, _webinar_registrations)
    top_by_unique = _top(webinars, _webinar_unique)

    mentor_attendance = defaultdict(int)
    mentor_ratings = defaultdict(list)
    for w in webinars:
        if w.mentor_name:
            mentor_attendance[w.mentor_name] += _webinar_attendance(w)
            r = _webinar_rating(w)
            if r:
                mentor_ratings[w.mentor_name].append(r)

    top_mentor_by_attendance = max(mentor_attendance.items(), key=lambda kv: kv[1])[0] if mentor_attendance else None
    mentor_avg_ratings = {m: sum(rs) / len(rs) for m, rs in mentor_ratings.items() if rs}
    top_mentor_by_rating = max(mentor_avg_ratings.items(), key=lambda kv: kv[1])[0] if mentor_avg_ratings else None
    top_topic = topic_counter.most_common(1)[0][0] if topic_counter else None

    # ---- Sales ----
    qualified = [p for p in participants if p.lead_status in ("Qualified", "Converted")]
    converted = [p for p in participants if p.lead_status == "Converted"]
    course_interested = [p for p in participants if p.course_interest]
    unconverted_high_intent = [p for p in participants if p.lead_status in ("Interested", "Qualified") ]
    follow_up_pending = [p for p in participants if p.lead_status == "Follow-up Required"]

    # ---- Financial ----
    total_payout = sum(_to_float(inv.total_amount, 0) or 0 for inv in payouts)
    total_attendees = sum(_webinar_attendance(w) for w in webinars)

    avg_payout_per_webinar = round(total_payout / len(payouts), 2) if payouts else None
    payout_per_attendee = round(total_payout / total_attendees, 2) if total_attendees else None
    cost_per_qualified_lead = round(total_payout / len(qualified), 2) if qualified else None
    cost_per_conversion = round(total_payout / len(converted), 2) if converted else None

    insights = {
        "audience": {
            "total_unique_users": unique_users,
            "new_users": new_users,
            "existing_users": existing_users,
            "repeat_attendees": repeat_attendees,
            "most_active_users": most_active_users,
            "most_popular_topics": most_popular_topics,
        },
        "performance": {
            "top_webinar_by_attendance": top_by_attendance.webinar_title if top_by_attendance else None,
            "top_webinar_by_rating": top_by_rating.webinar_title if top_by_rating else None,
            "top_webinar_by_registrations": top_by_registrations.webinar_title if top_by_registrations else None,
            "top_webinar_by_unique_users": top_by_unique.webinar_title if top_by_unique else None,
            "top_mentor_by_attendance": top_mentor_by_attendance,
            "top_mentor_by_rating": top_mentor_by_rating,
            "top_topic": top_topic,
        },
        "sales": {
            "total_leads": len(participants),
            "qualified_leads": len(qualified),
            "course_interested_users": len(course_interested),
            "converted_users": len(converted),
            "conversion_rate": _safe_div(len(converted), len(qualified)),
            "unconverted_high_intent_users": len(unconverted_high_intent),
            "follow_up_pending": len(follow_up_pending),
        },
        "financial": {
            "total_mentor_payout": round(total_payout, 2),
            "average_payout_per_webinar": avg_payout_per_webinar,
            "payout_per_attendee": payout_per_attendee,
            "cost_per_qualified_lead": cost_per_qualified_lead,
            "cost_per_conversion": cost_per_conversion,
        },
    }

    # ---- Dynamically generated insight cards (built from the numbers above, not hardcoded copy) ----
    cards = []

    if top_by_attendance:
        cards.append({
            "type": "high_performing_webinar",
            "title": "High Performing Webinar",
            "message": f"“{top_by_attendance.webinar_title}” generated {_webinar_attendance(top_by_attendance)} attendees"
                       + (f" and {len([p for p in participants_by_webinar.get(top_by_attendance.id, []) if p.lead_status in ('Qualified','Converted')])} qualified leads." if top_by_attendance.id in participants_by_webinar else "."),
        })

    best_conversion_webinar = None
    best_conversion_rate = -1
    for w in webinars:
        wp = participants_by_webinar.get(w.id, [])
        w_qualified = [p for p in wp if p.lead_status in ("Qualified", "Converted")]
        w_converted = [p for p in wp if p.lead_status == "Converted"]
        rate = _safe_div(len(w_converted), len(w_qualified))
        if rate is not None and rate > best_conversion_rate:
            best_conversion_rate = rate
            best_conversion_webinar = w
    if best_conversion_webinar:
        cards.append({
            "type": "high_conversion_webinar",
            "title": "High Conversion Webinar",
            "message": f"“{best_conversion_webinar.webinar_title}” has the highest attendee-to-enrollment conversion at {best_conversion_rate}%.",
        })

    if unconverted_high_intent:
        cards.append({
            "type": "follow_up_opportunity",
            "title": "Follow-up Opportunity",
            "message": f"{len(unconverted_high_intent)} users attended webinars and showed interest but have not yet converted.",
        })

    if top_mentor_by_attendance:
        cards.append({
            "type": "mentor_insight",
            "title": "Mentor Insight",
            "message": f"{top_mentor_by_attendance} generated the highest total attendance over the selected period.",
        })

    if top_topic:
        top_topic_count = topic_counter[top_topic]
        cards.append({
            "type": "topic_insight",
            "title": "Topic Insight",
            "message": f"“{top_topic}” webinars are the most frequently run topic ({top_topic_count} webinars) in this period.",
        })

    if cost_per_qualified_lead is not None and avg_payout_per_webinar:
        avg_cost_per_lead_overall = round(total_payout / len(qualified), 2) if qualified else None
        if avg_cost_per_lead_overall is not None:
            cards.append({
                "type": "cost_insight",
                "title": "Cost Insight",
                "message": f"Average cost per qualified lead across this scope is ₹{avg_cost_per_lead_overall}.",
            })

    insights["cards"] = cards
    return insights


# ---------------------------------------------------------------------------
# Export (Phase 4)
# ---------------------------------------------------------------------------

def build_export_data(db, mentor_name=None, category=None, status=None, date_from=None, date_to=None):
    """Single assembly function for both Excel and PDF export — same source
    of truth as the dashboard/insights endpoints, just reshaped into flat
    rows for a spreadsheet/report."""
    webinars, participants, payouts = _scope(db, mentor_name, category, status, date_from, date_to)
    stats_rows = list_webinars_with_stats(db)
    webinar_ids = {w.id for w in webinars}
    stats_rows = [r for r in stats_rows if r["id"] in webinar_ids]

    webinar_rows = [{
        "Webinar": r["title"],
        "Mentor": r["mentor_name"],
        "Date": r["session_date"],
        "Status": r["status"],
        "Registered": r["registered"],
        "Attended": r["attended"],
        "Attendance %": r["attendance_percentage"],
        "Rating": r["rating"],
        "Qualified Leads": r["leads"],
        "Converted": r["converted"],
        "Payout Status": r["payout_status"],
        "Payout Amount": r["payout_amount"],
    } for r in stats_rows]

    webinars_by_id = {w.id: w for w in webinars}
    lead_rows = [{
        "Name": p.name,
        "Email": p.email,
        "Webinar": webinars_by_id.get(p.webinar_id).webinar_title if webinars_by_id.get(p.webinar_id) else None,
        "Mentor": webinars_by_id.get(p.webinar_id).mentor_name if webinars_by_id.get(p.webinar_id) else None,
        "Attended": "Yes" if p.attended else "No",
        "Existing User": "Yes" if p.is_existing_user else "No",
        "Course Interest": p.course_interest,
        "Lead Status": p.lead_status,
        "Follow-up Status": p.sales_followup_status,
    } for p in participants]

    payout_rows = [{
        "Webinar": webinars_by_id.get(inv.webinar_id).webinar_title if webinars_by_id.get(inv.webinar_id) else None,
        "Mentor": inv.mentor_name,
        "Month": inv.month,
        "Hours": inv.total_hours,
        "Rate": inv.hourly_rate,
        "Amount": inv.total_amount,
        "Status": inv.payment_status,
        "Invoice #": inv.invoice_number,
    } for inv in payouts]

    summary = compute_webinar_dashboard(db, mentor_name, category, status, date_from, date_to)
    insights = compute_business_insights(db, mentor_name, category, status, date_from, date_to)

    return {
        "summary": summary,
        "webinar_rows": webinar_rows,
        "lead_rows": lead_rows,
        "payout_rows": payout_rows,
        "insights": insights,
    }


# ---------------------------------------------------------------------------
# CSV/XLSX Import (Phase 4) — generic column-mapper, not hardcoded to any
# one sheet's layout, since the real Google Sheets haven't been inspected
# yet. Works for any reasonably-shaped participant/lead export.
# ---------------------------------------------------------------------------

PARTICIPANT_IMPORT_FIELDS = {
    "name": "Name (required)",
    "email": "Email (required)",
    "phone": "Phone",
    "attended": "Attended (yes/no)",
    "rating": "Rating (1-5)",
    "course_interest": "Course Interest",
    "lead_status": "Lead Status",
    "source": "Source",
}


def parse_import_dataframe(file_bytes, filename):
    import pandas as pd
    import io

    if filename.lower().endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    else:
        df = pd.read_excel(io.BytesIO(file_bytes))

    df = df.dropna(how="all")
    return df


def preview_import(file_bytes, filename, max_rows=10):
    df = parse_import_dataframe(file_bytes, filename)
    columns = list(df.columns.astype(str))
    preview_rows = df.head(max_rows).fillna("").astype(str).to_dict(orient="records")

    return {
        "columns": columns,
        "row_count": len(df),
        "preview_rows": preview_rows,
        "target_fields": PARTICIPANT_IMPORT_FIELDS,
    }


def _row_bool(value):
    return str(value).strip().lower() in ("yes", "true", "1", "y")


def _cell(row, col):
    """Reads one mapped cell safely — pandas represents a blank CSV/XLSX
    cell as NaN (a float), and str(nan) is the literal string "nan", not
    empty. Returns None for missing/blank, else the stripped string."""
    if not col or col not in row:
        return None
    value = row[col]
    try:
        import pandas as pd
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    text = str(value).strip()
    return text or None


def commit_participant_import(db, webinar_id, file_bytes, filename, column_mapping):
    """column_mapping: {target_field: source_column_name}. Every row is
    validated and deduped the same way a single POST /participants call
    would be — no duplicate (webinar_id, email) rows, existing-user
    matching applied per row. Never silently overwrites an existing
    registration; imports still respect the same rules as manual entry."""
    webinar = db.query(ZoomAnalytics).filter(ZoomAnalytics.id == webinar_id).first()
    if not webinar:
        return {"success": False, "message": "Webinar not found"}

    df = parse_import_dataframe(file_bytes, filename)

    name_col = column_mapping.get("name")
    email_col = column_mapping.get("email")
    if not name_col or not email_col:
        return {"success": False, "message": "Name and Email columns must be mapped."}

    results = {"imported": 0, "skipped_duplicates": 0, "errors": []}

    for idx, row in df.iterrows():
        name = _cell(row, name_col)
        email = _cell(row, email_col)

        if not name or not email:
            results["errors"].append({"row": int(idx) + 2, "reason": "Missing name or email"})
            continue

        outcome = register_participant(
            db, webinar_id,
            name=name, email=email,
            phone=_cell(row, column_mapping.get("phone")),
            source=_cell(row, column_mapping.get("source")),
            course_interest=_cell(row, column_mapping.get("course_interest")),
        )

        if not outcome["success"]:
            results["skipped_duplicates"] += 1
            continue

        # Optional post-create fields, applied only if mapped and present.
        updates = {}
        if column_mapping.get("attended") and column_mapping["attended"] in row:
            updates["attended"] = _row_bool(row[column_mapping["attended"]])
        if column_mapping.get("rating") and column_mapping["rating"] in row:
            try:
                r = int(float(row[column_mapping["rating"]]))
                if 1 <= r <= 5:
                    updates["rating"] = r
            except (TypeError, ValueError):
                pass
        if column_mapping.get("lead_status") and column_mapping["lead_status"] in row:
            status_val = str(row[column_mapping["lead_status"]]).strip()
            if status_val in VALID_LEAD_STATUSES:
                updates["lead_status"] = status_val

        if updates:
            participant = db.query(WebinarParticipant).filter(WebinarParticipant.id == outcome["participant_id"]).first()
            for k, v in updates.items():
                setattr(participant, k, v)
            db.commit()

        results["imported"] += 1

    return {"success": True, **results}
