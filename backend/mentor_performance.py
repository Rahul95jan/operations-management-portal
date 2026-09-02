"""Mentor Business Performance ("Mentor 360") — centralized scoring service.

Aggregates data that already exists elsewhere (Sessions, NPS feedback, Resource
Portal compliance, Invoices, Batches) into one weighted Mentor Business Score.
This module is the single source of truth: the dashboard, the scorecard table,
the mentor-detail page, and both exports all call get_mentor_scorecard() —
never duplicate this math anywhere else.

No new database tables. Weights are a plain constant for now, not DB-backed.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from statistics import median

from models.session import Session as SessionModel
from models.nps import NPSFeedback
from models.invoice import Invoice
from models.batch import Batch
from resource_analytics import compute_mentor_performance

DIMENSION_WEIGHTS = {
    "delivery_performance": 20,
    "attendance_engagement": 15,
    "learner_experience": 20,
    "session_quality": 15,
    "resource_compliance": 15,
    "reliability": 5,
    "productivity": 5,
    "cost_efficiency": 5,
}  # sums to 100

CLASSIFICATION_BANDS = [
    (85, "Excellent"),
    (70, "Strong Performer"),
    (55, "Needs Attention"),
    (40, "At Risk"),
    (0, "Critical"),
]

RISK_FROM_CLASSIFICATION = {
    "Excellent": "Low",
    "Strong Performer": "Low",
    "Needs Attention": "Medium",
    "At Risk": "High",
    "Critical": "Critical",
}


def _to_float(value, default=None):
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _classify(score):
    if score is None:
        return "N/A"
    for threshold, label in CLASSIFICATION_BANDS:
        if score >= threshold:
            return label
    return "Critical"


def _risk_level(classification):
    return RISK_FROM_CLASSIFICATION.get(classification, "N/A")


def _weighted_overall_score(dimension_scores):
    """dimension_scores: {dim_key: score_or_None}. Drops None dims, renormalizes
    remaining weights to sum to 1.0. Returns (overall_score_or_None, weights_used)."""
    available = {k: v for k, v in dimension_scores.items() if v is not None}

    if not available:
        return None, {}

    total_weight = sum(DIMENSION_WEIGHTS[k] for k in available)
    weights_used = {k: DIMENSION_WEIGHTS[k] / total_weight for k in available}

    overall = sum(available[k] * weights_used[k] for k in available)
    return round(overall, 1), weights_used


# ---------------------------------------------------------------------------
# Per-dimension calculators
# ---------------------------------------------------------------------------

def _delivery_performance(sessions):
    if not sessions:
        return None

    scheduled = sum(1 for s in sessions if s.status == "Scheduled")
    completed = sum(1 for s in sessions if s.status == "Completed")
    cancelled = sum(1 for s in sessions if s.status == "Cancelled")
    total = len(sessions)

    completion_pct = round((completed / total) * 100, 1) if total else 0
    cancellation_pct = round((cancelled / total) * 100, 1) if total else 0

    return {
        "score": completion_pct,
        "total_sessions": total,
        "scheduled": scheduled,
        "completed": completed,
        "cancelled": cancelled,
        "rescheduled": "Not tracked",
        "completion_percent": completion_pct,
        "cancellation_percent": cancellation_pct,
        "reschedule_percent": "Not tracked",
    }


def _attendance_engagement(sessions):
    with_attendance = [s for s in sessions if s.attendance_percentage is not None]
    if not with_attendance:
        return None

    avg_attendance = round(sum(s.attendance_percentage for s in with_attendance) / len(with_attendance), 1)
    registered = sum(s.registered_students or 0 for s in sessions)
    attended = sum(s.attended_students or 0 for s in sessions)
    low_attendance_sessions = sum(1 for s in with_attendance if s.attendance_percentage < 60)

    return {
        "score": avg_attendance,
        "avg_attendance_percent": avg_attendance,
        "registered_learners": registered,
        "attended_learners": attended,
        "low_attendance_sessions": low_attendance_sessions,
    }


def _learner_experience(db, mentor_name, course_name=None, batch_name=None, date_from=None, date_to=None):
    query = db.query(NPSFeedback).filter(NPSFeedback.mentor_name == mentor_name)
    if course_name:
        query = query.filter(NPSFeedback.course_name == course_name)
    if batch_name:
        query = query.filter(NPSFeedback.batch_name == batch_name)
    # NPSFeedback has no session-date field — only created_at (submission date).
    # Date-range filtering here is intentionally NOT applied against session
    # dates (no such field exists); left unfiltered by date in V1.

    records = query.all()
    if not records:
        return None

    total = len(records)
    promoters = sum(1 for r in records if r.nps_score >= 9)
    detractors = sum(1 for r in records if r.nps_score <= 6)
    passives = total - promoters - detractors
    nps_score = round(((promoters - detractors) / total) * 100) if total else 0

    avg_instructor = round(sum(r.instructor_rating or 0 for r in records) / total, 2)
    avg_doubt = round(sum(r.doubt_rating or 0 for r in records) / total, 2)

    # Score this dimension on a 0-100 scale: blend instructor/doubt (0-5 -> 0-100)
    # with the NPS score (-100..100 -> 0..100), weighted evenly.
    rating_component = ((avg_instructor + avg_doubt) / 2) / 5 * 100
    nps_component = (nps_score + 100) / 2
    score = round((rating_component + nps_component) / 2, 1)

    return {
        "score": score,
        "avg_instructor_rating": avg_instructor,
        "avg_doubt_rating": avg_doubt,
        "nps_score": nps_score,
        "feedback_count": total,
        "promoters": promoters,
        "passives": passives,
        "detractors": detractors,
    }


def _session_quality(sessions):
    with_feedback = [s for s in sessions if s.feedback_score is not None and s.feedback_score > 0]
    if not with_feedback:
        return None

    avg_feedback = round(sum(s.feedback_score for s in with_feedback) / len(with_feedback), 2)
    score = round((avg_feedback / 5) * 100, 1)  # feedback_score is on a 0-5 scale

    return {
        "score": score,
        "avg_session_feedback_score": avg_feedback,
        "qa_score": "N/A",
    }


def _resource_compliance(db, mentor_name, date_from=None, date_to=None, course_name=None, batch_name=None):
    rows = compute_mentor_performance(
        db, date_from=date_from, date_to=date_to, course_name=course_name, batch_name=batch_name
    )
    row = next((r for r in rows if r["mentor_name"] == mentor_name), None)
    if not row or row["required"] == 0:
        return None

    return {
        "score": row["compliance_score"],
        "required": row["required"],
        "received": row["received"],
        "pending": row["pending"],
        "delayed": row["delayed"],
        "on_time_percent": row["on_time_percent"],
        "avg_delay_hours": row["avg_delay_hours"],
        "reminder_count": row["reminder_count"],
    }


def _reliability(delivery, resource_compliance):
    components = []
    if delivery:
        components.append(delivery["completion_percent"])
        components.append(max(0, 100 - delivery["cancellation_percent"]))
    if resource_compliance:
        components.append(resource_compliance["score"])

    if not components:
        return None

    score = round(sum(components) / len(components), 1)
    return {"score": score}


def _productivity(sessions, all_sessions_by_batch_strength):
    if not sessions:
        return None

    completed = [s for s in sessions if s.status == "Completed"]
    batches = {s.batch_name for s in sessions if s.batch_name}
    learners_served = sum(s.attended_students or 0 for s in sessions)
    avg_learners = round(learners_served / len(sessions), 1) if sessions else 0

    # Productivity score: a light normalization against a reasonable ceiling
    # (20 completed sessions ~= fully productive for the filtered period),
    # capped at 100 — a business heuristic, not a discovered fact.
    score = min(100, round((len(completed) / 20) * 100, 1)) if completed else 0

    return {
        "score": score,
        "sessions_delivered": len(sessions),
        "sessions_completed": len(completed),
        "learners_served": learners_served,
        "batches_served": len(batches),
        "avg_learners_per_session": avg_learners,
    }


def _cost_efficiency(mentor_invoices, peer_median_cost_per_session):
    if not mentor_invoices:
        return None

    total_amount = sum(_to_float(inv.total_amount, 0) or 0 for inv in mentor_invoices)
    total_hours = sum(_to_float(inv.total_hours, 0) or 0 for inv in mentor_invoices)
    total_sessions = sum(inv.total_sessions or 0 for inv in mentor_invoices)

    if total_sessions == 0:
        return None

    cost_per_session = round(total_amount / total_sessions, 2)
    cost_per_hour = round(total_amount / total_hours, 2) if total_hours else None

    # Peer-relative scoring, deliberately NOT an absolute penalty scale: a
    # high-quality mentor with a higher rate should not be classified as a
    # poor performer just because they cost more. Score 100 at/below the
    # peer median cost/session, taper to a floor of 50 by 2x the median.
    if not peer_median_cost_per_session or peer_median_cost_per_session <= 0:
        score = 100.0
    elif cost_per_session <= peer_median_cost_per_session:
        score = 100.0
    else:
        ratio = cost_per_session / peer_median_cost_per_session  # >1
        score = max(50.0, round(100 - (ratio - 1) * 50, 1))

    return {
        "score": score,
        "cost_per_session": cost_per_session,
        "cost_per_hour": cost_per_hour,
        "total_cost": round(total_amount, 2),
        "total_invoiced_sessions": total_sessions,
    }


def _learning_outcomes(batches):
    """Supplementary only — not a weighted dimension (the 8-dimension weight
    table doesn't include it). Informational display on the Mentor 360 page."""
    with_completion = [b for b in batches if b.course_completion is not None]
    if not with_completion:
        return None

    avg_completion = round(sum(b.course_completion for b in with_completion) / len(with_completion), 1)
    total_dropouts = sum(b.dropout_count or 0 for b in batches)

    return {
        "avg_course_completion_percent": avg_completion,
        "total_dropouts": total_dropouts,
        "batches_considered": len(with_completion),
    }


# ---------------------------------------------------------------------------
# Assembly
# ---------------------------------------------------------------------------

def _filtered_sessions(db, mentor_name=None, course_name=None, batch_name=None, date_from=None, date_to=None):
    query = db.query(SessionModel)
    if mentor_name:
        query = query.filter(SessionModel.mentor_name == mentor_name)
    if course_name:
        query = query.filter(SessionModel.course_name == course_name)
    if batch_name:
        query = query.filter(SessionModel.batch_name == batch_name)
    if date_from:
        query = query.filter(SessionModel.session_date >= date_from)
    if date_to:
        query = query.filter(SessionModel.session_date <= date_to)
    return query.all()


def _filtered_invoices(db, mentor_name=None, batch_name=None, date_from=None, date_to=None):
    query = db.query(Invoice)
    if mentor_name:
        query = query.filter(Invoice.mentor_name == mentor_name)
    if batch_name:
        query = query.filter(Invoice.batch_name == batch_name)
    if date_from:
        query = query.filter(Invoice.month >= date_from[:7])
    if date_to:
        query = query.filter(Invoice.month <= date_to[:7])
    return query.all()


def get_mentor_scorecard(db, mentor_name=None, course_name=None, batch_name=None, date_from=None, date_to=None):
    sessions = _filtered_sessions(
        db, mentor_name=mentor_name, course_name=course_name, batch_name=batch_name,
        date_from=date_from, date_to=date_to,
    )
    invoices = _filtered_invoices(
        db, mentor_name=mentor_name, batch_name=batch_name, date_from=date_from, date_to=date_to,
    )
    batch_query = db.query(Batch)
    if course_name:
        batch_query = batch_query.filter(Batch.course_name == course_name)
    if batch_name:
        batch_query = batch_query.filter(Batch.batch_name == batch_name)
    if mentor_name:
        batch_query = batch_query.filter(Batch.mentor_name == mentor_name)
    batches = batch_query.all()

    sessions_by_mentor = defaultdict(list)
    for s in sessions:
        if s.mentor_name:
            sessions_by_mentor[s.mentor_name].append(s)

    invoices_by_mentor = defaultdict(list)
    for inv in invoices:
        if inv.mentor_name:
            invoices_by_mentor[inv.mentor_name].append(inv)

    batches_by_mentor = defaultdict(list)
    for b in batches:
        if b.mentor_name:
            batches_by_mentor[b.mentor_name].append(b)

    mentor_names = set(sessions_by_mentor) | set(invoices_by_mentor) | set(batches_by_mentor)
    if mentor_name:
        mentor_names = {mentor_name} if mentor_name in mentor_names else set()

    # Peer median cost/session across the filtered scope, for cost-efficiency scoring.
    peer_costs = []
    for name, invs in invoices_by_mentor.items():
        total_amount = sum(_to_float(inv.total_amount, 0) or 0 for inv in invs)
        total_sessions = sum(inv.total_sessions or 0 for inv in invs)
        if total_sessions:
            peer_costs.append(total_amount / total_sessions)
    peer_median_cost = median(peer_costs) if peer_costs else None

    rows = []
    for name in mentor_names:
        mentor_sessions = sessions_by_mentor.get(name, [])
        mentor_invoices = invoices_by_mentor.get(name, [])
        mentor_batches = batches_by_mentor.get(name, [])

        delivery = _delivery_performance(mentor_sessions)
        attendance = _attendance_engagement(mentor_sessions)
        learner_experience = _learner_experience(
            db, name, course_name=course_name, batch_name=batch_name, date_from=date_from, date_to=date_to,
        )
        session_quality = _session_quality(mentor_sessions)
        resource_compliance = _resource_compliance(
            db, name, date_from=date_from, date_to=date_to, course_name=course_name, batch_name=batch_name,
        )
        reliability = _reliability(delivery, resource_compliance)
        productivity = _productivity(mentor_sessions, None)
        cost_efficiency = _cost_efficiency(mentor_invoices, peer_median_cost)
        learning_outcomes = _learning_outcomes(mentor_batches)

        dimension_scores = {
            "delivery_performance": delivery["score"] if delivery else None,
            "attendance_engagement": attendance["score"] if attendance else None,
            "learner_experience": learner_experience["score"] if learner_experience else None,
            "session_quality": session_quality["score"] if session_quality else None,
            "resource_compliance": resource_compliance["score"] if resource_compliance else None,
            "reliability": reliability["score"] if reliability else None,
            "productivity": productivity["score"] if productivity else None,
            "cost_efficiency": cost_efficiency["score"] if cost_efficiency else None,
        }

        overall_score, weights_used = _weighted_overall_score(dimension_scores)
        classification = _classify(overall_score)
        risk = _risk_level(classification)

        rows.append({
            "mentor_name": name,
            "overall_score": overall_score if overall_score is not None else "N/A",
            "classification": classification,
            "risk": risk,
            "score_basis": "Calculated from available metrics" if overall_score is not None and len(weights_used) < len(DIMENSION_WEIGHTS) else "Calculated from all metrics",
            "delivery_performance": delivery,
            "attendance_engagement": attendance,
            "learner_experience": learner_experience,
            "session_quality": session_quality,
            "resource_compliance": resource_compliance,
            "reliability": reliability,
            "productivity": productivity,
            "cost_efficiency": cost_efficiency,
            "learning_outcomes": learning_outcomes,
        })

    rows.sort(key=lambda r: r["overall_score"] if isinstance(r["overall_score"], (int, float)) else -1, reverse=True)
    return rows


def get_mentor_trend(db, mentor_name, months=6):
    now = datetime.utcnow()
    points = []

    for i in range(months - 1, -1, -1):
        # Walk back i months from the current month (calendar-month buckets).
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1

        start = f"{year:04d}-{month:02d}-01"
        if month == 12:
            end_year, end_month = year + 1, 1
        else:
            end_year, end_month = year, month + 1
        end = f"{end_year:04d}-{end_month:02d}-01"

        rows = get_mentor_scorecard(db, mentor_name=mentor_name, date_from=start, date_to=end)
        score = rows[0]["overall_score"] if rows else None
        if isinstance(score, (int, float)):
            points.append({"month": f"{year:04d}-{month:02d}", "overall_score": score})

    if len(points) < 2:
        return []

    return points
