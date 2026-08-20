from datetime import datetime, timedelta
from collections import defaultdict


def _classify_compliance(score):
    if score >= 90:
        return "Excellent"
    if score >= 75:
        return "Good"
    if score >= 60:
        return "Needs Improvement"
    return "Critical"


def _heatmap_color(score):
    if score >= 90:
        return "green"
    if score >= 75:
        return "yellow"
    if score >= 60:
        return "orange"
    return "red"


def _refresh_active_requirements(db):
    from models.resource_requirement import ResourceRequirement
    from resource_tracking import refresh_requirement_status

    now = datetime.utcnow()
    requirements = db.query(ResourceRequirement).all()

    changed = False
    for r in requirements:
        if refresh_requirement_status(r, now):
            changed = True
    if changed:
        db.commit()

    return [r for r in requirements if r.status != "Not Required"]


def compute_mentor_performance(db):
    """Resource Compliance Score = On-Time Submissions / Total Required Submissions x 100,
    per your spec's own formula — same value as on-time %, shown as two columns intentionally."""
    from resource_tracking import compute_delay

    active = _refresh_active_requirements(db)

    groups = defaultdict(list)
    for r in active:
        groups[r.mentor_name or "Unknown"].append(r)

    rows = []
    for name, reqs in groups.items():
        received = [r for r in reqs if r.received_at]
        pending = [r for r in reqs if not r.received_at]
        delayed = [r for r in reqs if r.status == "Delayed"]
        on_time = [r for r in received if r.status == "Complete"]

        required = len(reqs)
        compliance_score = round((len(on_time) / required) * 100, 1) if required else 0

        delay_list = [
            compute_delay(r.due_at, r.received_at)[1]
            for r in received
            if r.due_at and r.received_at
        ]
        avg_delay = round(sum(delay_list) / len(delay_list), 2) if delay_list else 0

        rows.append({
            "mentor_name": name,
            "sessions": len({r.session_id for r in reqs}),
            "required": required,
            "received": len(received),
            "pending": len(pending),
            "delayed": len(delayed),
            "on_time_percent": compliance_score,
            "avg_delay_hours": avg_delay,
            "reminder_count": sum(r.reminder_count or 0 for r in reqs),
            "compliance_score": compliance_score,
            "classification": _classify_compliance(compliance_score),
        })

    rows.sort(key=lambda x: x["compliance_score"])
    return rows


def compute_mentor_heatmap(db, weeks=4):
    active = [r for r in _refresh_active_requirements(db) if r.due_at]

    now = datetime.utcnow()
    start_of_this_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    week_starts = [start_of_this_week - timedelta(weeks=(weeks - 1 - i)) for i in range(weeks)]

    def week_index(due_at):
        for i, wk_start in enumerate(week_starts):
            if wk_start <= due_at < wk_start + timedelta(weeks=1):
                return i
        return None

    mentors = sorted({r.mentor_name for r in active if r.mentor_name})
    buckets = {m: [[] for _ in range(weeks)] for m in mentors}

    for r in active:
        if not r.mentor_name:
            continue
        idx = week_index(r.due_at)
        if idx is not None:
            buckets[r.mentor_name][idx].append(r)

    rows = []
    for m in mentors:
        cells = []
        for i in range(weeks):
            reqs = buckets[m][i]
            if not reqs:
                cells.append({"week": i + 1, "score": None, "color": "gray"})
                continue
            on_time = [r for r in reqs if r.status == "Complete"]
            score = round((len(on_time) / len(reqs)) * 100, 1)
            cells.append({"week": i + 1, "score": score, "color": _heatmap_color(score)})
        rows.append({"mentor_name": m, "weeks": cells})

    return {
        "week_labels": [f"Week {i + 1}" for i in range(weeks)],
        "rows": rows,
    }


def compute_resource_analytics(db):
    from models.resource_email_log import ResourceEmailLog
    from models.resource import Resource
    from resource_tracking import compute_delay

    active = _refresh_active_requirements(db)
    received = [r for r in active if r.received_at]
    pending = [r for r in active if not r.received_at]
    delayed = [r for r in active if r.status == "Delayed"]
    on_time = [r for r in received if r.status == "Complete"]

    required_count = len(active)
    received_count = len(received)

    completion_rate = round((received_count / required_count) * 100, 1) if required_count else 0
    on_time_rate = round((len(on_time) / received_count) * 100, 1) if received_count else 0

    delay_hours_list = [
        compute_delay(r.due_at, r.received_at)[1]
        for r in received
        if r.due_at and r.received_at
    ]
    avg_delay_hours = round(sum(delay_hours_list) / len(delay_hours_list), 2) if delay_hours_list else 0

    total_reminders_sent = (
        db.query(ResourceEmailLog)
        .filter(
            ResourceEmailLog.email_type.in_(["Reminder", "Final Reminder"]),
            ResourceEmailLog.status == "Sent",
        )
        .count()
    )

    overall = {
        "total_sessions": len({r.session_id for r in active}),
        "resources_required": required_count,
        "resources_received": received_count,
        "resources_pending": len(pending),
        "resources_delayed": len(delayed),
        "completion_rate": completion_rate,
        "on_time_rate": on_time_rate,
        "avg_delay_hours": avg_delay_hours,
        "mentors_with_pending": len({r.mentor_name for r in pending if r.mentor_name}),
        "total_reminders_sent": total_reminders_sent,
    }

    on_time_vs_delayed = [
        {"label": "On-Time", "count": len(on_time)},
        {"label": "Delayed", "count": len(delayed)},
    ]

    pending_by_mentor = defaultdict(int)
    for r in pending:
        pending_by_mentor[r.mentor_name or "Unknown"] += 1
    pending_by_mentor_chart = sorted(
        ({"mentor_name": k, "count": v} for k, v in pending_by_mentor.items()),
        key=lambda x: -x["count"],
    )

    resources = db.query(Resource).all()

    type_counts = defaultdict(int)
    for res in resources:
        type_counts[res.resource_type] += 1
    resource_type_distribution = sorted(
        ({"resource_type": k, "count": v} for k, v in type_counts.items()),
        key=lambda x: -x["count"],
    )

    delay_by_type = defaultdict(list)
    for r in received:
        if r.due_at and r.received_at:
            delay_by_type[r.resource_type].append(compute_delay(r.due_at, r.received_at)[1])
    avg_delay_by_type = sorted(
        (
            {"resource_type": k, "avg_delay_hours": round(sum(v) / len(v), 2)}
            for k, v in delay_by_type.items()
            if v
        ),
        key=lambda x: -x["avg_delay_hours"],
    )

    mentor_groups = defaultdict(list)
    for r in active:
        mentor_groups[r.mentor_name or "Unknown"].append(r)

    mentor_performance = []
    for name, reqs in mentor_groups.items():
        req_received = [r for r in reqs if r.received_at]
        rate = round((len(req_received) / len(reqs)) * 100, 1) if reqs else 0
        mentor_performance.append({
            "mentor_name": name,
            "required": len(reqs),
            "received": len(req_received),
            "completion_rate": rate,
        })
    mentor_performance.sort(key=lambda x: x["completion_rate"])

    per_day = defaultdict(int)
    for res in resources:
        if res.submitted_at:
            per_day[res.submitted_at.strftime("%Y-%m-%d")] += 1
    submission_trend = [{"date": d, "count": c} for d, c in sorted(per_day.items())]

    reminder_logs = (
        db.query(ResourceEmailLog)
        .filter(ResourceEmailLog.email_type.in_(["Reminder", "Final Reminder"]))
        .all()
    )
    reminders_per_day = defaultdict(int)
    for e in reminder_logs:
        if e.sent_at:
            reminders_per_day[e.sent_at.strftime("%Y-%m-%d")] += 1
    reminder_trend = [{"date": d, "count": c} for d, c in sorted(reminders_per_day.items())]

    return {
        "overall": overall,
        "on_time_vs_delayed": on_time_vs_delayed,
        "pending_by_mentor": pending_by_mentor_chart,
        "resource_type_distribution": resource_type_distribution,
        "avg_delay_by_type": avg_delay_by_type,
        "mentor_performance": mentor_performance,
        "submission_trend": submission_trend,
        "reminder_trend": reminder_trend,
    }
