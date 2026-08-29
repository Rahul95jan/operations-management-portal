from datetime import datetime

STATUS_PRIORITY = {
    "Overdue": 0,
    "Partially Submitted": 1,
    "Pending": 2,
    "Delayed": 3,
    "Complete": 4,
    "Not Required": 5,
}


def compute_delay(due_at, received_at):
    """Minutes/hours late. received_at before or equal to due_at (or no due_at) -> 0."""
    if not due_at or not received_at:
        return 0, 0.0

    delta_minutes = (received_at - due_at).total_seconds() / 60

    if delta_minutes <= 0:
        return 0, 0.0

    return round(delta_minutes), round(delta_minutes / 60, 2)


def refresh_requirement_status(requirement, now=None):
    """Recomputes a requirement's status/delay from its due_at/received_at. Returns True if changed."""
    if requirement.status == "Not Required":
        return False

    now = now or datetime.utcnow()

    if requirement.received_at:
        delay_minutes, _ = compute_delay(requirement.due_at, requirement.received_at)
        new_status = "Delayed" if delay_minutes > 0 else "Complete"
    elif requirement.due_at and requirement.due_at < now:
        new_status = "Overdue"
    else:
        new_status = "Pending"

    if requirement.status == new_status:
        return False

    requirement.status = new_status
    return True


def _session_status(active_reqs, received):
    required_count = len(active_reqs)

    if required_count == 0:
        return "Not Required"

    if len(received) == 0:
        return "Overdue" if any(r.status == "Overdue" for r in active_reqs) else "Pending"

    if len(received) == required_count:
        return "Delayed" if any(r.status == "Delayed" for r in received) else "Complete"

    return "Partially Submitted"


def _aggregate(reqs):
    active_reqs = [r for r in reqs if r.status != "Not Required"]
    received = [r for r in active_reqs if r.received_at]
    missing = [r for r in active_reqs if not r.received_at]

    due_ats = [r.due_at for r in active_reqs if r.due_at]
    received_ats = [r.received_at for r in received]

    delay_hours_list = [
        compute_delay(r.due_at, r.received_at)[1]
        for r in received
        if r.due_at and r.received_at
    ]

    return {
        "active_reqs": active_reqs,
        "received": received,
        "missing": missing,
        "required_count": len(active_reqs),
        "received_count": len(received),
        "missing_count": len(missing),
        "status": _session_status(active_reqs, received),
        "due_at": min(due_ats) if due_ats else None,
        "received_at": max(received_ats) if received_ats else None,
        "delay_hours": round(max(delay_hours_list), 2) if delay_hours_list else 0,
        "reminder_count": sum(r.reminder_count or 0 for r in reqs),
    }


def session_resource_detail(db, session_id):
    """Raw ORM data + aggregate stats for one session's resource picture.
    Dict-conversion of requirements/resources is left to the caller (main.py
    already has _requirement_to_dict / _resource_to_dict)."""
    from models.session import Session as SessionModel
    from models.resource_requirement import ResourceRequirement
    from models.resource import Resource
    from models.resource_email_log import ResourceEmailLog

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        return None

    now = datetime.utcnow()

    requirements = (
        db.query(ResourceRequirement)
        .filter(ResourceRequirement.session_id == session_id)
        .all()
    )

    changed = any(refresh_requirement_status(r, now) for r in requirements)
    if changed:
        db.commit()

    resources = (
        db.query(Resource)
        .filter(Resource.session_id == session_id)
        .order_by(Resource.created_at)
        .all()
    )

    emails = (
        db.query(ResourceEmailLog)
        .filter(ResourceEmailLog.session_id == session_id)
        .order_by(ResourceEmailLog.sent_at)
        .all()
    )

    agg = _aggregate(requirements)

    return {
        "session": session,
        "requirements": requirements,
        "resources": resources,
        "emails": emails,
        "missing_resources": [r.resource_name for r in agg["missing"]],
        "required_count": agg["required_count"],
        "received_count": agg["received_count"],
        "missing_count": agg["missing_count"],
        "status": agg["status"],
        "due_at": agg["due_at"],
        "received_at": agg["received_at"],
        "delay_hours": agg["delay_hours"],
        "reminder_count": agg["reminder_count"],
    }


def list_pending_requirements(db):
    """One row per still-outstanding requirement (Pending or Overdue), joined with
    its session's batch/course/topic — the working list for Operations to chase."""
    from models.session import Session as SessionModel
    from models.resource_requirement import ResourceRequirement

    now = datetime.utcnow()

    requirements = (
        db.query(ResourceRequirement)
        .filter(ResourceRequirement.status.in_(["Pending", "Overdue"]))
        .all()
    )

    changed = any(refresh_requirement_status(r, now) for r in requirements)
    if changed:
        db.commit()

    requirements = [r for r in requirements if r.status in ("Pending", "Overdue")]

    session_ids = list({r.session_id for r in requirements})
    sessions_by_id = {}
    if session_ids:
        sessions = db.query(SessionModel).filter(SessionModel.id.in_(session_ids)).all()
        sessions_by_id = {s.id: s for s in sessions}

    rows = []
    for r in requirements:
        session = sessions_by_id.get(r.session_id)
        _, delay_hours = compute_delay(r.due_at, now) if r.due_at else (0, 0.0)

        rows.append({
            "requirement_id": r.id,
            "mentor_name": r.mentor_name,
            "session_id": r.session_id,
            "session_topic": session.topic if session else None,
            "batch_name": session.batch_name if session else None,
            "course_name": session.course_name if session else None,
            "resource_name": r.resource_name,
            "resource_type": r.resource_type,
            "resource_category": r.resource_category,
            "status": r.status,
            "due_at": r.due_at,
            "delay_hours": delay_hours,
            "reminder_count": r.reminder_count,
            "last_reminder_sent_at": r.last_reminder_sent_at,
        })

    rows.sort(key=lambda x: (x["due_at"] is None, x["due_at"]))
    return rows


def build_tracking_table(db):
    from models.session import Session as SessionModel
    from models.resource_requirement import ResourceRequirement

    now = datetime.utcnow()

    requirements = db.query(ResourceRequirement).all()

    by_session = {}
    changed = False

    for r in requirements:
        if refresh_requirement_status(r, now):
            changed = True
        by_session.setdefault(r.session_id, []).append(r)

    if changed:
        db.commit()

    session_ids = list(by_session.keys())

    sessions_by_id = {}
    if session_ids:
        sessions = db.query(SessionModel).filter(SessionModel.id.in_(session_ids)).all()
        sessions_by_id = {s.id: s for s in sessions}

    rows = []

    for session_id, reqs in by_session.items():
        session = sessions_by_id.get(session_id)
        if not session:
            continue

        agg = _aggregate(reqs)

        rows.append({
            "session_id": session.id,
            "session_topic": session.topic,
            "session_date": session.session_date,
            "course_name": session.course_name,
            "batch_name": session.batch_name,
            "mentor_name": session.mentor_name,
            "required_count": agg["required_count"],
            "received_count": agg["received_count"],
            "missing_count": agg["missing_count"],
            "required_resources": [r.resource_name for r in agg["active_reqs"]],
            "received_resources": [r.resource_name for r in agg["received"]],
            "missing_resources": [r.resource_name for r in agg["missing"]],
            "status": agg["status"],
            "due_at": agg["due_at"],
            "received_at": agg["received_at"],
            "delay_hours": agg["delay_hours"],
            "reminder_count": agg["reminder_count"],
        })

    rows.sort(key=lambda r: STATUS_PRIORITY.get(r["status"], 6))

    return rows
