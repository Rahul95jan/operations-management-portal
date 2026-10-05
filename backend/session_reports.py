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
from datetime import datetime

from dateutil import parser as date_parser

from sqlalchemy import func, or_

from models.session import Session as SessionModel
from models.session_analytics import SessionAnalytics
from models.session_report import SessionReport
from models.session_attendance import SessionAttendance
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


def _row_dict(session, report_map, course_map=None):
    report = report_map.get(session.id)
    return {
        "id": session.id,
        "session_date": session.session_date,
        "session_time": session.session_time,
        "duration": session.duration,
        "topic": session.topic,
        "mentor_name": session.mentor_name,
        "batch_name": session.batch_name,
        # The portal shows courses: fall back to the course of the linked record.
        "course_name": session.course_name or (course_map or {}).get((session.batch_name or "").strip().lower()) or session.batch_name,
        "session_type": session.session_type or session.category,
        "status": session.status,
        "learner_count": session.registered_students or 0,
        "attendance": session.attended_students or 0,
        "attendance_percentage": session.attendance_percentage or 0,
        "recording_status": _recording_status(session),
        "report_status": report.report_status if report else "Pending",
        "rating": session.feedback_score or None,
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
    if session_ids:
        reports = db.query(SessionReport).filter(SessionReport.session_id.in_(session_ids)).all()
        report_map = {r.session_id: r for r in reports}

    course_map = _course_by_batch(db)
    rows = [_row_dict(s, report_map, course_map) for s in sessions]

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


def attendance_bundle(db, session_id):
    session = _get_session(db, session_id)
    if not session:
        return None

    rows = db.query(SessionAttendance).filter(SessionAttendance.session_id == session_id).order_by(SessionAttendance.id.asc()).all()

    if rows:
        present = len([r for r in rows if r.attendance_status == "Present"])
        late = len([r for r in rows if r.attendance_status == "Late"])
        # Expected learners can exceed the rows (a participants report only
        # lists people who joined), so absentees = expected - attendees.
        total = max(len(rows), session.registered_students or 0)
        absent = max(total - present - late, 0)
        attendance_percentage = round((present + late) / total * 100, 2) if total else 0
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
        total = session.registered_students or 0
        present = session.attended_students or 0
        absent = max(total - present, 0)
        late = 0
        attendance_percentage = session.attendance_percentage or 0
        average_join_time = None
        average_leave_time = None
        learners = []

    return {
        "total_learners": total,
        "present": present,
        "absent": absent,
        "late": late,
        # Unique people who joined (repeat joins already merged on import).
        "unique_joiners": present + late,
        "attendance_percentage": attendance_percentage,
        "average_join_time": average_join_time,
        "average_leave_time": average_leave_time,
        "has_detailed_rows": bool(rows),
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


def poll_bundle(db, session_id):
    session = _get_session(db, session_id)
    if not session:
        return None

    report = db.query(SessionReport).filter(SessionReport.session_id == session_id).first()
    poll = _poll_summary(report)
    if not poll:
        return {"has_data": False}

    attended = session.attended_students or 0
    responses = poll.get("poll_responses") or 0
    conducted = poll.get("polls_conducted") or 0
    # Each attendee can answer every poll, so compare the average responses
    # per poll with the number who attended (only once attendance exists).
    response_rate = min(round(responses / conducted / attended * 100, 1), 100.0) if attended and conducted else None
    return {
        "has_data": True,
        "polls_conducted": poll.get("polls_conducted", 0),
        "poll_responses": responses,
        "poll_average_rating": poll.get("poll_average_rating", 0),
        "highest_rated_poll": poll.get("highest_rated_poll", 0),
        "poll_health_status": poll.get("poll_health_status", "No Data"),
        # Responses vs learners who attended — only meaningful once attendance is imported.
        "response_rate": response_rate,
        "polls": poll.get("polls", []),
        "imported_at": poll.get("imported_at"),
    }


# =========================================================
# Mutations
# =========================================================

def replace_attendance(db, session_id, entries, expected_learners):
    """Replaces a session's attendance with imported rows and syncs the
    session's aggregate counts so lists, analytics and exports agree."""
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
    if session:
        session.registered_students = 0
        session.attended_students = 0
        session.attendance_percentage = 0
    db.commit()
    return removed


def save_poll_summary(db, session_id, summary):
    report = db.query(SessionReport).filter(SessionReport.session_id == session_id).first()
    if not report:
        report = SessionReport(session_id=session_id, report_status="Pending")
        db.add(report)
    previous = _poll_summary(report)
    report.poll_summary = json.dumps(summary) if summary else None

    # The session's rating (feedback_score) is what Session Reports, Mentor 360
    # and Analytics average — keep it in step with the imported poll rating.
    session = _get_session(db, session_id)
    if session:
        if summary and summary.get("poll_average_rating"):
            session.feedback_score = summary["poll_average_rating"]
        elif previous and session.feedback_score == previous.get("poll_average_rating"):
            session.feedback_score = 0  # clearing the poll removes the rating it set
    db.commit()


def backfill_poll_ratings(db):
    """Sessions whose polls were imported before ratings were synced: copy the
    poll average into the session rating if it has none. Safe to re-run."""
    updated = 0
    for report in db.query(SessionReport).filter(SessionReport.poll_summary.isnot(None)).all():
        poll = _poll_summary(report)
        session = _get_session(db, report.session_id)
        if poll and poll.get("poll_average_rating") and session and not session.feedback_score:
            session.feedback_score = poll["poll_average_rating"]
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
# Export
# =========================================================

def build_csv(db, filters, search=None):
    rows = _filtered_rows(db, search=search, **filters)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "Session ID", "Date", "Time", "Duration (min)", "Topic", "Mentor",
        "Course", "Session Type", "Status", "Learner Count",
        "Attendance", "Attendance %", "Report Status",
    ])

    for r in rows:
        writer.writerow([
            r["id"], r["session_date"], r["session_time"], r["duration"],
            r["topic"], r["mentor_name"], r["course_name"],
            r["session_type"], r["status"], r["learner_count"], r["attendance"],
            r["attendance_percentage"], r["report_status"],
        ])

    buffer.seek(0)
    return buffer.getvalue()
