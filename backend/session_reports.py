"""Business logic for the Session Reports module.

Builds on the existing Session / SessionAnalytics / Resource / NPSFeedback /
Mentor tables (matched by plain ids / shared names, same "no FK" convention
used throughout this codebase — see resource_export.py) plus two new tables,
SessionReport (the narrative ops report) and SessionAttendance (per-learner
attendance rows). No new auth/permission system — mirrors every other module.
"""

import csv
import io
import json
import math
from datetime import datetime

from dateutil import parser as date_parser

from sqlalchemy import func, or_

from models.session import Session as SessionModel
from models.session_analytics import SessionAnalytics
from models.session_report import SessionReport
from models.session_attendance import SessionAttendance
from models.session_attendance_import import SessionAttendanceImport
from models.session_poll_snapshot import SessionPollSnapshot
from models.webinar_registration import WebinarRegistration
from models.mentor import Mentor
from models.resource import Resource
from models.nps import NPSFeedback
from models.batch import Batch


# =========================================================
# Filtering
# =========================================================

def _name_matches(column, value):
    # Names are free text across modules ("RAHUL KUMAR SINGH" on a session vs
    # "Rahul Kumar Singh" in Mentor Management), so compare case- and
    # whitespace-insensitively instead of returning an empty result.
    return func.lower(func.trim(column)) == value.strip().lower()


def _apply_base_filters(query, date_from=None, date_to=None, status=None,
                         mentor_name=None, batch_name=None, course_name=None,
                         session_type=None):
    if date_from:
        query = query.filter(SessionModel.session_date >= date_from)
    if date_to:
        query = query.filter(SessionModel.session_date <= date_to)
    if status:
        query = query.filter(SessionModel.status == status)
    if mentor_name:
        query = query.filter(_name_matches(SessionModel.mentor_name, mentor_name))
    if batch_name:
        query = query.filter(_name_matches(SessionModel.batch_name, batch_name))
    if course_name:
        # Sessions name their course, or (older ones) link to a course record
        # by batch_name — match either.
        wanted = course_name.strip().lower()
        linked = [
            b.batch_name for b in query.session.query(Batch).all()
            if b.batch_name and (b.course_name or b.batch_name).strip().lower() == wanted
        ]
        conditions = [_name_matches(SessionModel.course_name, course_name)]
        if linked:
            conditions.append(SessionModel.batch_name.in_(linked))
        query = query.filter(or_(*conditions))
    if session_type:
        query = query.filter(or_(SessionModel.session_type == session_type, SessionModel.category == session_type))
    return query


def _recording_status(session):
    return "Available" if session.recording_link else "Not Available"


def _course_by_batch(db):
    return {
        b.batch_name.strip().lower(): (b.course_name or b.batch_name)
        for b in db.query(Batch).all() if b.batch_name
    }


def _row_dict(session, report_map, course_map=None, import_map=None, poll_map=None):
    report = report_map.get(session.id)
    imp = (import_map or {}).get(session.id)
    poll = (poll_map or {}).get(session.id)

    attendance_pct = session.attendance_percentage or 0
    if imp and not imp.has_registrant_total:
        attendance_pct = None

    return {
        "id": session.id,
        "session_date": session.session_date,
        "session_time": session.session_time,
        "duration": session.duration,
        "topic": session.topic,
        "mentor_name": session.mentor_name,
        "batch_name": session.batch_name,
        "course_name": session.course_name or (course_map or {}).get((session.batch_name or "").strip().lower()) or session.batch_name,
        "session_type": session.session_type or session.category,
        "status": session.status,
        "learner_count": session.registered_students or 0,
        "attendance": session.attended_students or 0,
        "attendance_percentage": attendance_pct,
        "recording_status": _recording_status(session),
        "report_status": report.report_status if report else "Pending",
        "rating": session.feedback_score or None,
        "poll_average_rating": poll.overall_avg if poll else None,
        "poll_health_status": poll.poll_health if poll else None,
    }


def _filtered_rows(db, date_from=None, date_to=None, status=None, mentor_name=None,
                    batch_name=None, course_name=None, session_type=None,
                    recording_status=None, report_status=None, search=None):
    sessions = _apply_base_filters(
        db.query(SessionModel), date_from, date_to, status, mentor_name,
        batch_name, course_name, session_type,
    ).all()

    session_ids = [s.id for s in sessions]
    report_map = {}
    import_map = {}
    poll_map = {}
    if session_ids:
        reports = db.query(SessionReport).filter(SessionReport.session_id.in_(session_ids)).all()
        report_map = {r.session_id: r for r in reports}
        imports = db.query(SessionAttendanceImport).filter(SessionAttendanceImport.session_id.in_(session_ids)).all()
        import_map = {i.session_id: i for i in imports}
        polls = db.query(SessionPollSnapshot).filter(SessionPollSnapshot.session_id.in_(session_ids)).all()
        poll_map = {p.session_id: p for p in polls}

    course_map = _course_by_batch(db)
    rows = [_row_dict(s, report_map, course_map, import_map, poll_map) for s in sessions]

    if recording_status:
        rows = [r for r in rows if r["recording_status"] == recording_status]

    if report_status:
        rows = [r for r in rows if r["report_status"] == report_status]

    if search:
        term = search.lower()
        rows = [
            r for r in rows
            if term in str(r["id"]).lower()
            or term in (r["topic"] or "").lower()
            or term in (r["mentor_name"] or "").lower()
            or term in (r["course_name"] or "").lower()
        ]

    return rows


# =========================================================
# List + summary
# =========================================================

def list_session_reports(db, filters, page=1, page_size=20, sort_by="session_date", sort_dir="desc", search=None):
    rows = _filtered_rows(db, search=search, **filters)

    reverse = sort_dir == "desc"
    rows.sort(key=lambda r: (r.get(sort_by) is None, r.get(sort_by)), reverse=reverse)

    total = len(rows)
    page = max(page, 1)
    page_size = max(page_size, 1)
    start = (page - 1) * page_size
    items = rows[start:start + page_size]

    return {"items": items, "total": total, "page": page, "page_size": page_size}


def session_reports_summary(db, filters):
    rows = _filtered_rows(db, **filters)

    total_sessions = len(rows)
    live_sessions = len([r for r in rows if r["status"] == "Live"])
    completed_sessions = len([r for r in rows if r["status"] == "Completed"])
    cancelled_sessions = len([r for r in rows if r["status"] == "Cancelled"])
    upcoming_sessions = len([r for r in rows if r["status"] in ("Upcoming", "Scheduled")])

    total_learners_attended = sum(r["attendance"] for r in rows)

    attendance_values = [r["attendance_percentage"] for r in rows if r["attendance_percentage"]]
    average_attendance_percentage = round(sum(attendance_values) / len(attendance_values), 2) if attendance_values else 0

    duration_values = [r["duration"] for r in rows if r["duration"]]
    average_session_duration = round(sum(duration_values) / len(duration_values), 2) if duration_values else 0

    rating_values = [r["rating"] for r in rows if r["rating"]]
    average_rating = round(sum(rating_values) / len(rating_values), 2) if rating_values else None

    return {
        "total_sessions": total_sessions,
        "live_sessions": live_sessions,
        "completed_sessions": completed_sessions,
        "cancelled_sessions": cancelled_sessions,
        "upcoming_sessions": upcoming_sessions,
        "total_learners_attended": total_learners_attended,
        "average_attendance_percentage": average_attendance_percentage,
        "average_session_duration": average_session_duration,
        "average_rating": average_rating,
    }


def dashboard_today_summary(db):
    today = datetime.utcnow().strftime("%Y-%m-%d")

    sessions_today = db.query(SessionModel).filter(SessionModel.session_date == today).all()
    session_ids = [s.id for s in sessions_today]

    reports = []
    if session_ids:
        reports = db.query(SessionReport).filter(SessionReport.session_id.in_(session_ids)).all()
    report_map = {r.session_id: r for r in reports}

    completed_today = len([s for s in sessions_today if s.status == "Completed"])
    live_now = len([s for s in sessions_today if s.status == "Live"])

    attendance_values = [s.attendance_percentage for s in sessions_today if s.attendance_percentage]
    attendance_today = round(sum(attendance_values) / len(attendance_values), 2) if attendance_values else 0

    pending_reports = len([
        s for s in sessions_today
        if report_map.get(s.id) is None or report_map[s.id].report_status == "Pending"
    ])

    return {
        "sessions_today": len(sessions_today),
        "completed_today": completed_today,
        "live_now": live_now,
        "attendance_today": attendance_today,
        "pending_reports": pending_reports,
    }


# =========================================================
# Detail bundles
# =========================================================

def _get_session(db, session_id):
    return db.query(SessionModel).filter(SessionModel.id == session_id).first()


def get_session(db, session_id):
    return _get_session(db, session_id)


def _get_or_default_report(db, session_id):
    report = db.query(SessionReport).filter(SessionReport.session_id == session_id).first()
    if report:
        return report, True
    return SessionReport(session_id=session_id, report_status="Pending"), False


def _mentor_info(db, session):
    mentor = db.query(Mentor).filter(Mentor.name == session.mentor_name).first()

    mentor_sessions = db.query(SessionModel).filter(SessionModel.mentor_name == session.mentor_name).all()
    session_count = len(mentor_sessions)

    scores = [s.feedback_score for s in mentor_sessions if s.feedback_score]
    average_feedback_score = round(sum(scores) / len(scores), 2) if scores else None

    return {
        "mentor_name": session.mentor_name,
        "mentor_email": session.mentor_email or (mentor.email if mentor else None),
        "expertise": mentor.expertise if mentor else None,
        "session_count": session_count,
        "average_feedback_score": average_feedback_score,
    }


def _performance_bundle(session, analytics, report, attendance_percentage):
    scheduled_duration = session.duration
    actual_duration = analytics.actual_duration if analytics and analytics.actual_duration else session.duration

    completion_percentage = None
    if session.status == "Completed":
        completion_percentage = 100
    elif session.status in ("Cancelled", "No Show"):
        completion_percentage = 0

    sla_status = "N/A"
    if scheduled_duration and actual_duration:
        variance_pct = abs(actual_duration - scheduled_duration) / scheduled_duration * 100
        sla_status = "Met" if variance_pct <= 15 else "Breached"

    recording_available = bool(session.recording_link) or bool(
        analytics and str(analytics.recording_available).lower() in ("yes", "true", "1")
    )

    return {
        "scheduled_duration": scheduled_duration,
        "actual_duration": actual_duration,
        "attendance_percentage": attendance_percentage,
        "completion_percentage": completion_percentage,
        "sla_status": sla_status,
        "recording_available": recording_available,
        "report_submitted": bool(report and report.report_status != "Pending"),
        "mentor_feedback_submitted": bool(report and report.mentor_feedback),
    }


def session_detail_bundle(db, session_id):
    session = _get_session(db, session_id)
    if not session:
        return None

    analytics = db.query(SessionAnalytics).filter(SessionAnalytics.session_id == session_id).first()
    report, report_exists = _get_or_default_report(db, session_id)

    resources = db.query(Resource).filter(Resource.session_id == session_id).all()

    performance = _performance_bundle(session, analytics, report if report_exists else None, session.attendance_percentage or 0)

    return {
        "session_info": {
            "id": session.id,
            "topic": session.topic,
            "session_date": session.session_date,
            "session_time": session.session_time,
            "duration": session.duration,
            "session_type": session.session_type or session.category,
            "status": session.status,
            "course_name": session.course_name,
            "batch_name": session.batch_name,
            "mentor_name": session.mentor_name,
            "mentor_email": session.mentor_email,
            "platform": session.platform,
            "meeting_link": session.meeting_link,
        },
        "content": {
            "topic": session.topic,
            "agenda": report.agenda,
            "learning_objectives": report.learning_objectives,
            "topics_covered": report.topics_covered,
            "lms_content_link": report.lms_content_link,
            "presentation_link": report.presentation_link,
            "assignment_link": report.assignment_link,
            "recording_link": session.recording_link,
            "resources": [
                {
                    "resource_type": r.resource_type,
                    "resource_category": r.resource_category,
                    "resource_title": r.resource_title,
                    "resource_url": r.resource_url,
                }
                for r in resources
            ],
        },
        "report": {
            "exists": report_exists,
            "summary": report.summary,
            "topics_covered": report.topics_covered,
            "learner_questions": report.learner_questions,
            "discussion_points": report.discussion_points,
            "issues_faced": report.issues_faced,
            "technical_issues": report.technical_issues,
            "learner_engagement": report.learner_engagement,
            "mentor_feedback": report.mentor_feedback,
            "operations_notes": report.operations_notes,
            "action_items": report.action_items,
            "follow_up_required": report.follow_up_required or False,
            "follow_up_date": report.follow_up_date,
            "report_status": report.report_status,
            "reviewed_by": report.reviewed_by,
        },
        "performance": performance,
        "mentor_info": _mentor_info(db, session),
    }


def live_details_bundle(db, session_id):
    session = _get_session(db, session_id)
    if not session:
        return None

    analytics = db.query(SessionAnalytics).filter(SessionAnalytics.session_id == session_id).first()

    scheduled_duration = session.duration
    actual_duration = analytics.actual_duration if analytics and analytics.actual_duration else None
    duration_variance = (actual_duration - scheduled_duration) if (actual_duration is not None and scheduled_duration is not None) else None

    return {
        "meeting_link": session.meeting_link,
        "platform": session.platform,
        "session_started_at": analytics.mentor_join_time if analytics else None,
        "session_ended_at": analytics.mentor_leave_time if analytics else None,
        "actual_duration": actual_duration,
        "scheduled_duration": scheduled_duration,
        "duration_variance": duration_variance,
        "recording_available": bool(session.recording_link) or bool(
            analytics and str(analytics.recording_available).lower() in ("yes", "true", "1")
        ),
        "recording_link": session.recording_link,
        "recording_status": _recording_status(session),
        "session_link_status": "Active" if session.meeting_link else "Not Set",
    }


def _avg_time_of_day(values):
    parsed = []
    for v in values:
        if not v:
            continue
        for fmt in ("%H:%M", "%I:%M %p"):
            try:
                parsed.append(datetime.strptime(v.strip(), fmt))
                break
            except ValueError:
                continue
        else:
            # Zoom exports full date-times ("09/25/2026 08:31:05 PM").
            try:
                parsed.append(date_parser.parse(v))
            except (ValueError, TypeError, OverflowError):
                pass

    if not parsed:
        return None

    total_minutes = sum(p.hour * 60 + p.minute for p in parsed)
    avg_minutes = round(total_minutes / len(parsed))
    return f"{avg_minutes // 60:02d}:{avg_minutes % 60:02d}"


def _to_clock_time(value):
    """Store join/leave as clock time (HH:MM) for average calculations."""
    if not value:
        return None
    text = str(value).strip()
    for fmt in ("%H:%M", "%I:%M %p", "%I:%M:%S %p"):
        try:
            parsed = datetime.strptime(text, fmt)
            return f"{parsed.hour:02d}:{parsed.minute:02d}"
        except ValueError:
            continue
    try:
        parsed = date_parser.parse(text)
        return f"{parsed.hour:02d}:{parsed.minute:02d}"
    except (ValueError, TypeError, OverflowError):
        return text


def _safe_int(value):
    try:
        return int(float(str(value).strip().replace(",", "")))
    except (TypeError, ValueError):
        return None


def _summary_int(summary, *keys):
    for key in keys:
        val = _safe_int((summary or {}).get(key))
        if val is not None:
            return val
    return None


def _stay_metrics(durations, class_minutes):
    values = sorted([d for d in durations if d and d > 0])
    if not values or not class_minutes:
        return None, None, None, None
    mid = len(values) // 2
    median = values[mid] if len(values) % 2 else round((values[mid - 1] + values[mid]) / 2, 1)
    half = class_minutes / 2
    three_quarter = class_minutes * 0.75
    n = len(values)
    return (
        median,
        round(len([v for v in values if v >= half]) / n * 100, 1),
        round(len([v for v in values if v >= three_quarter]) / n * 100, 1),
        round(len([v for v in values if v < 15]) / n * 100, 1),
    )


def _import_bundle(imp):
    if not imp:
        return None
    return {
        "unique_viewers": imp.unique_viewers,
        "total_users": imp.total_users,
        "max_concurrent_views": imp.max_concurrent_views,
        "actual_duration_minutes": imp.actual_duration_minutes,
        "hold_rate": imp.hold_rate,
        "median_stay_minutes": imp.median_stay_minutes,
        "pct_stayed_half": imp.pct_stayed_half,
        "pct_stayed_three_quarter": imp.pct_stayed_three_quarter,
        "pct_under_15_min": imp.pct_under_15_min,
        "has_registrant_total": imp.has_registrant_total,
        "imported_at": imp.imported_at.isoformat() if imp.imported_at else None,
    }


def attendance_bundle(db, session_id):
    session = _get_session(db, session_id)
    if not session:
        return None

    imp = db.query(SessionAttendanceImport).filter(SessionAttendanceImport.session_id == session_id).first()
    rows = db.query(SessionAttendance).filter(SessionAttendance.session_id == session_id).order_by(SessionAttendance.id.asc()).all()
    webinar_count = db.query(WebinarRegistration).filter(WebinarRegistration.session_id == session_id).count()

    if rows:
        present = len([r for r in rows if r.attendance_status == "Present"])
        late = len([r for r in rows if r.attendance_status == "Late"])
        attended_rows = [r for r in rows if r.attendance_status in ("Present", "Late")]
        average_join_time = _avg_time_of_day([r.join_time for r in attended_rows])
        average_leave_time = _avg_time_of_day([r.leave_time for r in attended_rows])
        learners = [
            {
                "id": r.id,
                "learner_name": r.learner_name,
                "learner_email": r.learner_email,
                "join_time": r.join_time,
                "leave_time": r.leave_time,
                "duration_minutes": r.duration_minutes,
                "attendance_status": r.attendance_status,
            }
            for r in rows
        ]
    else:
        present = session.attended_students or 0
        late = 0
        average_join_time = None
        average_leave_time = None
        learners = []

    unique_viewers = imp.unique_viewers if imp else (present + late if rows else session.attended_students)
    attendance_percentage = None
    if imp and imp.has_registrant_total and session.attendance_percentage:
        attendance_percentage = session.attendance_percentage
    elif not imp and session.registered_students:
        attendance_percentage = session.attendance_percentage or 0

    total_registrants = imp.registrant_total if imp and imp.has_registrant_total else (session.registered_students or 0)
    absent = max(total_registrants - present - late, 0) if total_registrants else 0

    return {
        "total_learners": total_registrants or unique_viewers,
        "present": present,
        "absent": absent,
        "late": late,
        "unique_joiners": unique_viewers,
        "attendance_percentage": attendance_percentage,
        "average_join_time": average_join_time,
        "average_leave_time": average_leave_time,
        "has_detailed_rows": bool(rows),
        "has_webinar_registrations": webinar_count > 0,
        "import_summary": _import_bundle(imp),
        "learners": learners,
    }


def feedback_bundle(db, session_id):
    session = _get_session(db, session_id)
    if not session:
        return None

    report = db.query(SessionReport).filter(SessionReport.session_id == session_id).first()

    nps_records = (
        db.query(NPSFeedback)
        .filter(
            NPSFeedback.batch_name == session.batch_name,
            NPSFeedback.mentor_name == session.mentor_name,
        )
        .all()
    )

    nps_scores = [r.nps_score for r in nps_records if r.nps_score is not None]
    average_nps = round(sum(nps_scores) / len(nps_scores), 2) if nps_scores else None

    poll = _poll_summary(report)

    return {
        "average_rating": session.feedback_score or (poll or {}).get("poll_average_rating") or None,
        "nps": {
            "average_score": average_nps,
            "response_count": len(nps_records),
            "note": "Matched by batch + mentor (no direct session link exists for NPS feedback).",
        },
        "mentor_feedback": report.mentor_feedback if report else None,
        "operations_feedback": report.operations_notes if report else None,
    }


def _poll_summary(report):
    if not report or not report.poll_summary:
        return None
    try:
        return json.loads(report.poll_summary)
    except (ValueError, TypeError):
        return None


# Which poll questions measure what. The academy's standard poll asks about
# teaching style, doubt handling and overall effectiveness (in that order).
POLL_DIMENSION_KEYWORDS = [
    ("teaching", ("teach", "explain", "explanation", "instructor", "trainer", "mentor's style", "style")),
    ("doubt", ("doubt", "quer", "clarif", "question")),
    ("effectiveness", ("effective", "overall", "session")),
]
POLL_DEFAULT_ORDER = ["teaching", "doubt", "effectiveness"]


def _classify_question(label):
    text = (label or "").lower()
    for dim, words in POLL_DIMENSION_KEYWORDS:
        if any(w in text for w in words):
            return dim
    return None


def poll_dimensions(summary):
    """Teaching / doubt / effectiveness averages from a parsed poll summary,
    weighted by each poll's responses. Questions are matched by wording; polls
    imported before wording was stored fall back to the standard order."""
    sums = {d: 0.0 for d in POLL_DEFAULT_ORDER}
    weights = {d: 0 for d in POLL_DEFAULT_ORDER}
    for poll in (summary or {}).get("polls", []):
        averages = poll.get("question_averages") or []
        labels = poll.get("question_labels") or []
        responses = poll.get("responses") or 1
        for i, value in enumerate(averages):
            dim = _classify_question(labels[i]) if i < len(labels) else None
            if dim is None and not labels and len(averages) == len(POLL_DEFAULT_ORDER):
                dim = POLL_DEFAULT_ORDER[i]
            if dim:
                sums[dim] += value * responses
                weights[dim] += responses
    return {d: (round(sums[d] / weights[d], 2) if weights[d] else None) for d in POLL_DEFAULT_ORDER}


def _apply_poll_to_session(session, summary):
    dims = poll_dimensions(summary)
    session.feedback_score = summary.get("poll_average_rating") or 0
    session.poll_teaching_rating = dims["teaching"]
    session.poll_doubt_rating = dims["doubt"]
    session.poll_effectiveness_rating = dims["effectiveness"]


def poll_bundle(db, session_id):
    session = _get_session(db, session_id)
    if not session:
        return None

    snap = db.query(SessionPollSnapshot).filter(SessionPollSnapshot.session_id == session_id).first()
    if not snap:
        return {"has_data": False}

    unique_viewers = session.attended_students or 0
    imp = db.query(SessionAttendanceImport).filter(SessionAttendanceImport.session_id == session_id).first()
    if imp and imp.unique_viewers:
        unique_viewers = imp.unique_viewers

    response_rate = round(snap.poll_responses / unique_viewers * 100, 1) if unique_viewers else None

    return {
        "has_data": True,
        "poll_name": snap.poll_name,
        "polls_conducted": snap.polls_conducted or 0,
        "poll_responses": snap.poll_responses or 0,
        "poll_average_rating": snap.overall_avg or 0,
        "poll_health_status": snap.poll_health or "No Data",
        "teaching_rating": snap.teaching_style_avg,
        "doubt_rating": snap.doubts_avg,
        "effectiveness_rating": snap.effectiveness_avg,
        "response_rate": response_rate,
        "imported_at": snap.imported_at.isoformat() if snap.imported_at else None,
    }


# =========================================================
# Mutations
# =========================================================

def import_attendance(db, session_id, entries, meeting_summary):
    """Replace session_attendance rows and sync session totals from Zoom summary."""
    session = _get_session(db, session_id)
    if not session:
        return None

    db.query(SessionAttendance).filter(SessionAttendance.session_id == session_id).delete()
    for e in entries:
        db.add(SessionAttendance(session_id=session_id, **e))

    unique_viewers = _summary_int(meeting_summary, "total_participants", "unique_viewers")
    if unique_viewers is None:
        unique_viewers = len([e for e in entries if e["attendance_status"] in ("Present", "Late")])

    total_users = _summary_int(meeting_summary, "total_users")
    max_concurrent = _summary_int(meeting_summary, "max_concurrent_views")
    actual_duration = _summary_int(meeting_summary, "duration_minutes", "actual_duration")
    registrant_total = _summary_int(meeting_summary, "approved_registrants", "total_registrants")
    has_registrant_total = registrant_total is not None and registrant_total > 0

    durations = [e.get("duration_minutes") or 0 for e in entries if e["attendance_status"] in ("Present", "Late")]
    median, pct_half, pct_three_quarter, pct_under_15 = _stay_metrics(durations, actual_duration or session.duration or 0)
    hold_rate = round(max_concurrent / unique_viewers * 100, 1) if max_concurrent and unique_viewers else None

    existing = db.query(SessionAttendanceImport).filter(SessionAttendanceImport.session_id == session_id).first()
    if not existing:
        existing = SessionAttendanceImport(session_id=session_id)
        db.add(existing)
        existing.previous_attended_students = session.attended_students
        existing.previous_registered_students = session.registered_students
        existing.previous_attendance_percentage = session.attendance_percentage

    existing.unique_viewers = unique_viewers
    existing.total_users = total_users
    existing.max_concurrent_views = max_concurrent
    existing.actual_duration_minutes = actual_duration
    existing.hold_rate = hold_rate
    existing.median_stay_minutes = median
    existing.pct_stayed_half = pct_half
    existing.pct_stayed_three_quarter = pct_three_quarter
    existing.pct_under_15_min = pct_under_15
    existing.has_registrant_total = has_registrant_total
    existing.registrant_total = registrant_total
    existing.imported_at = datetime.utcnow()

    session.attended_students = unique_viewers
    if has_registrant_total:
        session.registered_students = registrant_total
        session.attendance_percentage = round(unique_viewers / registrant_total * 100, 2) if registrant_total else 0

    db.commit()
    return {
        "unique_viewers": unique_viewers,
        "total_users": total_users,
        "max_concurrent_views": max_concurrent,
        "actual_duration_minutes": actual_duration,
        "hold_rate": hold_rate,
        "learner_rows": len(entries),
    }


def replace_attendance(db, session_id, entries, expected_learners):
    """Legacy helper — kept for manual row APIs."""
    session = _get_session(db, session_id)
    db.query(SessionAttendance).filter(SessionAttendance.session_id == session_id).delete()
    for e in entries:
        db.add(SessionAttendance(session_id=session_id, **e))
    attended = len([e for e in entries if e["attendance_status"] in ("Present", "Late")])
    total = max(len(entries), expected_learners or 0)
    if session:
        session.registered_students = total
        session.attended_students = attended
        session.attendance_percentage = round(attended / total * 100, 2) if total else 0
    db.commit()
    return {"total": total, "attended": attended}


def clear_attendance(db, session_id):
    session = _get_session(db, session_id)
    removed = db.query(SessionAttendance).filter(SessionAttendance.session_id == session_id).delete()
    imp = db.query(SessionAttendanceImport).filter(SessionAttendanceImport.session_id == session_id).first()
    if session and imp:
        if imp.previous_attended_students is not None:
            session.attended_students = imp.previous_attended_students
        if imp.previous_registered_students is not None:
            session.registered_students = imp.previous_registered_students
        if imp.previous_attendance_percentage is not None:
            session.attendance_percentage = imp.previous_attendance_percentage
        db.delete(imp)
    elif session:
        session.attended_students = 0
        session.registered_students = 0
        session.attendance_percentage = 0
    db.commit()
    return removed


def save_poll_snapshot(db, session_id, parsed, health_status, remarks=None):
    """Persist parsed poll report to session_poll_snapshot (not zoom_analytics)."""
    dims = poll_dimensions(parsed)
    snap = db.query(SessionPollSnapshot).filter(SessionPollSnapshot.session_id == session_id).first()
    if not snap:
        snap = SessionPollSnapshot(session_id=session_id)
        db.add(snap)

    polls = parsed.get("polls") or []
    snap.poll_name = polls[0]["name"] if polls else None
    snap.polls_conducted = parsed.get("polls_conducted") or 0
    snap.poll_responses = parsed.get("poll_responses") or 0
    snap.teaching_style_avg = dims.get("teaching")
    snap.doubts_avg = dims.get("doubt")
    snap.effectiveness_avg = dims.get("effectiveness")
    snap.overall_avg = parsed.get("poll_average_rating")
    snap.poll_health = health_status
    snap.remarks = json.dumps(remarks) if remarks else None
    snap.imported_at = datetime.utcnow()
    db.commit()


def clear_poll_snapshot(db, session_id):
    removed = db.query(SessionPollSnapshot).filter(SessionPollSnapshot.session_id == session_id).delete()
    db.commit()
    return removed


def save_poll_summary(db, session_id, summary):
    """Legacy JSON storage on session_reports — no longer written on import."""
    report = db.query(SessionReport).filter(SessionReport.session_id == session_id).first()
    if not report:
        report = SessionReport(session_id=session_id, report_status="Pending")
        db.add(report)
    report.poll_summary = json.dumps(summary) if summary else None
    db.commit()


def backfill_poll_ratings(db):
    """Sessions whose polls were imported before ratings were synced: copy the
    poll average into the session rating if it has none. Safe to re-run."""
    updated = 0
    for report in db.query(SessionReport).filter(SessionReport.poll_summary.isnot(None)).all():
        poll = _poll_summary(report)
        session = _get_session(db, report.session_id)
        if poll and poll.get("poll_average_rating") and session and (
            not session.feedback_score or session.poll_teaching_rating is None
        ):
            _apply_poll_to_session(session, poll)
            updated += 1
    if updated:
        db.commit()
    return updated


def upsert_report(db, session_id, data: dict):
    report = db.query(SessionReport).filter(SessionReport.session_id == session_id).first()
    if not report:
        report = SessionReport(session_id=session_id)
        db.add(report)

    for key, value in data.items():
        if value is not None:
            setattr(report, key, value)

    db.commit()
    db.refresh(report)
    return report


def update_report_status(db, session_id, report_status, reviewed_by=None):
    report = db.query(SessionReport).filter(SessionReport.session_id == session_id).first()
    if not report:
        report = SessionReport(session_id=session_id)
        db.add(report)

    report.report_status = report_status
    if reviewed_by:
        report.reviewed_by = reviewed_by

    db.commit()
    db.refresh(report)
    return report


def add_attendance_row(db, session_id, data: dict):
    row = SessionAttendance(session_id=session_id, **data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_attendance_row(db, attendance_id, data: dict):
    row = db.query(SessionAttendance).filter(SessionAttendance.id == attendance_id).first()
    if not row:
        return None

    for key, value in data.items():
        if value is not None:
            setattr(row, key, value)

    db.commit()
    db.refresh(row)
    return row


def delete_attendance_row(db, attendance_id):
    row = db.query(SessionAttendance).filter(SessionAttendance.id == attendance_id).first()
    if not row:
        return False

    db.delete(row)
    db.commit()
    return True


# =========================================================
# Operations Intelligence (real import data)
# =========================================================

def ops_intel_attendance(db, filters):
    rows = _filtered_rows(db, status="Completed", **{k: v for k, v in filters.items() if k != "status"})
    imports = {
        i.session_id: i
        for i in db.query(SessionAttendanceImport).filter(
            SessionAttendanceImport.session_id.in_([r["id"] for r in rows] or [0])
        ).all()
    }

    with_import = [imports[r["id"]] for r in rows if r["id"] in imports]
    unique_total = sum(i.unique_viewers or 0 for i in with_import)
    users_total = sum(i.total_users or 0 for i in with_import)
    peak_total = sum(i.max_concurrent_views or 0 for i in with_import)
    duration_values = [i.actual_duration_minutes for i in with_import if i.actual_duration_minutes]
    avg_duration = round(sum(duration_values) / len(duration_values)) if duration_values else None

    pct_values = [r["attendance_percentage"] for r in rows if r["attendance_percentage"]]
    average_pct = round(sum(pct_values) / len(pct_values)) if pct_values else None

    return {
        "sessions_with_import": len(with_import),
        "unique_viewers": unique_total,
        "total_users": users_total,
        "peak_concurrent": peak_total,
        "average_duration_minutes": avg_duration,
        "average_attendance_pct": average_pct,
    }


def ops_intel_quality(db, filters):
    rows = _filtered_rows(db, status="Completed", **{k: v for k, v in filters.items() if k != "status"})
    snaps = {
        s.session_id: s
        for s in db.query(SessionPollSnapshot).filter(
            SessionPollSnapshot.session_id.in_([r["id"] for r in rows] or [0])
        ).all()
    }

    with_poll = [snaps[r["id"]] for r in rows if r["id"] in snaps]
    if not with_poll:
        return {
            "sessions_with_poll": 0,
            "teaching_style_avg": None,
            "doubts_avg": None,
            "effectiveness_avg": None,
            "overall_avg": None,
            "poll_health": None,
            "total_responses": 0,
            "response_rate": None,
        }

    def avg(field):
        vals = [getattr(s, field) for s in with_poll if getattr(s, field) is not None]
        return round(sum(vals) / len(vals), 2) if vals else None

    teaching = avg("teaching_style_avg")
    doubts = avg("doubts_avg")
    effectiveness = avg("effectiveness_avg")
    overall = avg("overall_avg")
    health = "Good" if overall and overall >= 4.3 else ("Poor" if overall else None)
    total_responses = sum(s.poll_responses or 0 for s in with_poll)

    imports = {
        i.session_id: i
        for i in db.query(SessionAttendanceImport).filter(
            SessionAttendanceImport.session_id.in_([s.session_id for s in with_poll])
        ).all()
    }
    unique_viewers = sum(
        imports.get(s.session_id).unique_viewers or 0
        for s in with_poll
        if s.session_id in imports and imports[s.session_id].unique_viewers
    )
    response_rate = round(total_responses / unique_viewers * 100, 1) if unique_viewers else None

    return {
        "sessions_with_poll": len(with_poll),
        "teaching_style_avg": teaching,
        "doubts_avg": doubts,
        "effectiveness_avg": effectiveness,
        "overall_avg": overall,
        "poll_health": health,
        "total_responses": total_responses,
        "response_rate": response_rate,
    }


# =========================================================
# Export
# =========================================================

def build_csv(db, filters, search=None):
    rows = _filtered_rows(db, search=search, **filters)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "Session ID", "Date", "Time", "Duration (min)", "Topic", "Mentor",
        "Course", "Session Type", "Status", "Learner Count",
        "Attendance", "Attendance %", "Poll Avg", "Poll Health", "Report Status",
    ])

    for r in rows:
        writer.writerow([
            r["id"], r["session_date"], r["session_time"], r["duration"],
            r["topic"], r["mentor_name"], r["course_name"],
            r["session_type"], r["status"], r["learner_count"], r["attendance"],
            r["attendance_percentage"] if r["attendance_percentage"] is not None else "",
            r.get("poll_average_rating") or "",
            r.get("poll_health_status") or "",
            r["report_status"],
        ])

    buffer.seek(0)
    return buffer.getvalue()
