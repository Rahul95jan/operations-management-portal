from datetime import datetime


def build_export_rows(db):
    from models.session import Session as SessionModel
    from models.resource_requirement import ResourceRequirement
    from models.resource import Resource
    from resource_tracking import refresh_requirement_status, compute_delay

    now = datetime.utcnow()
    requirements = db.query(ResourceRequirement).all()

    changed = any(refresh_requirement_status(r, now) for r in requirements)
    if changed:
        db.commit()

    session_ids = list({r.session_id for r in requirements})
    sessions_by_id = {}
    if session_ids:
        sessions = db.query(SessionModel).filter(SessionModel.id.in_(session_ids)).all()
        sessions_by_id = {s.id: s for s in sessions}

    # Best-effort match of a submitted Resource to its requirement — there's no
    # direct FK between the two tables, so match on (session_id, resource_type),
    # keeping the most recently submitted one if there are duplicates.
    resources = db.query(Resource).all()
    resource_by_key = {}
    for res in resources:
        key = (res.session_id, res.resource_type)
        existing = resource_by_key.get(key)
        if not existing or (res.submitted_at or datetime.min) > (existing.submitted_at or datetime.min):
            resource_by_key[key] = res

    rows = []
    for r in requirements:
        session = sessions_by_id.get(r.session_id)
        res = resource_by_key.get((r.session_id, r.resource_type))

        delay_hours = 0.0
        if r.received_at:
            _, delay_hours = compute_delay(r.due_at, r.received_at)

        rows.append({
            "Session": session.topic if session else "",
            "Date": session.session_date if session else "",
            "Mentor": r.mentor_name or "",
            "Course": session.course_name if session else "",
            "Batch": session.batch_name if session else "",
            "Resource Type": r.resource_type,
            "Resource Title": res.resource_title if res else r.resource_name,
            "Status": r.status,
            "Required": "Yes" if r.is_required else "No",
            "Submitted": "Yes" if r.received_at else "No",
            "Due Date": r.due_at,
            "Received Date": r.received_at,
            "Delay (hrs)": delay_hours,
            "Reminder Count": r.reminder_count or 0,
        })

    return rows
