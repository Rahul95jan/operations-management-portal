#!/usr/bin/env python3
"""Unit tests for session and course health scoring (no DB required)."""

import sys
from types import SimpleNamespace

sys.path.insert(0, "/workspace/backend")

from session_reports import (
    compute_session_health,
    _score_course_health,
    _coverage_confidence,
    _rollup_health_metrics,
)


def ns(**kwargs):
    return SimpleNamespace(**kwargs)


def test_no_data_without_imports():
    session = ns(status="Completed", duration=120, recording_link="https://example.com", attended_students=100)
    result = compute_session_health(session, None, None, None)
    assert result["label"] == "No data"
    assert result["list_tier"] == "noData"


def test_healthy_session():
    session = ns(status="Completed", duration=120, recording_link="https://example.com/rec", attended_students=100)
    imp = ns(
        unique_viewers=100,
        median_stay_minutes=90,
        actual_duration_minutes=120,
        hold_rate=85.0,
        pct_under_15_min=5.0,
        has_registrant_total=False,
    )
    poll = ns(
        overall_avg=4.5,
        poll_responses=25,
        teaching_style_avg=4.6,
        doubts_avg=4.4,
        effectiveness_avg=4.5,
    )
    report = ns(report_status="Reviewed")
    result = compute_session_health(session, imp, poll, report)
    assert result["label"] == "Healthy"
    assert result["metrics"]["median_stay_pct"] == 75.0
    assert result["metrics"]["response_rate"] == 25.0


def test_critical_low_stay_and_poll():
    session = ns(status="Completed", duration=120, recording_link="https://example.com/rec", attended_students=80)
    imp = ns(
        unique_viewers=80,
        median_stay_minutes=20,
        actual_duration_minutes=120,
        hold_rate=40.0,
        pct_under_15_min=25.0,
        has_registrant_total=False,
    )
    poll = ns(
        overall_avg=3.2,
        poll_responses=10,
        teaching_style_avg=3.0,
        doubts_avg=3.1,
        effectiveness_avg=3.4,
    )
    report = ns(report_status="Reviewed")
    result = compute_session_health(session, imp, poll, report)
    assert result["label"] == "Critical"
    assert result["list_tier"] == "attention"


def test_watch_pending_report():
    session = ns(status="Completed", duration=60, recording_link=None, attended_students=50)
    imp = ns(
        unique_viewers=50,
        median_stay_minutes=35,
        actual_duration_minutes=60,
        hold_rate=70.0,
        pct_under_15_min=8.0,
        has_registrant_total=False,
    )
    poll = ns(
        overall_avg=4.4,
        poll_responses=12,
        teaching_style_avg=4.5,
        doubts_avg=4.3,
        effectiveness_avg=4.4,
    )
    report = ns(report_status="Pending")
    result = compute_session_health(session, imp, poll, report)
    assert result["label"] == "Watch"
    assert any("pending" in reason.lower() for reason in result["reasons"])


def test_course_health_scoring():
    delivery = {"median_stay_pct": 55.0, "early_bounce_pct": 10.0}
    experience = {
        "overall_avg": 4.4,
        "response_rate": 20.0,
        "teaching_style_avg": 4.5,
        "doubts_avg": 4.3,
        "effectiveness_avg": 4.4,
    }
    label, reasons = _score_course_health(delivery, experience, _coverage_confidence(85))
    assert label == "Healthy"
    assert reasons == []

    delivery = {"median_stay_pct": 35.0, "early_bounce_pct": 10.0}
    experience = {
        "overall_avg": 4.5,
        "response_rate": 20.0,
        "teaching_style_avg": 4.5,
        "doubts_avg": 4.4,
        "effectiveness_avg": 4.5,
    }
    label, reasons = _score_course_health(delivery, experience, _coverage_confidence(60))
    assert label == "Watch"
    assert reasons

    label, reasons = _score_course_health(delivery, experience, _coverage_confidence(30))
    assert label == "No data"


def test_mentor_rollup_groups_sessions():
    rows = [
        {"id": 1, "session_date": "2026-01-01", "topic": "Intro", "mentor_name": "Alice"},
        {"id": 2, "session_date": "2026-01-08", "topic": "Advanced", "mentor_name": "Bob"},
    ]
    sessions = {
        1: ns(status="Completed", duration=60, recording_link="https://example.com", attended_students=50),
        2: ns(status="Completed", duration=60, recording_link="https://example.com", attended_students=40),
    }
    imp = ns(
        unique_viewers=50,
        median_stay_minutes=40,
        actual_duration_minutes=60,
        hold_rate=80.0,
        pct_under_15_min=5.0,
        has_registrant_total=False,
    )
    poll = ns(
        overall_avg=4.5,
        poll_responses=10,
        teaching_style_avg=4.5,
        doubts_avg=4.4,
        effectiveness_avg=4.6,
    )
    imports = {1: imp, 2: imp}
    polls = {1: poll, 2: poll}
    reports = {1: ns(report_status="Reviewed"), 2: ns(report_status="Reviewed")}

    rollup = _rollup_health_metrics(rows, sessions, imports, polls, reports)
    assert rollup["completed_sessions"] == 2
    assert rollup["coverage_pct"] == 100.0
    assert rollup["health_label"] == "Healthy"
    assert len(rollup["sessions"]) == 2


if __name__ == "__main__":
    test_no_data_without_imports()
    test_healthy_session()
    test_critical_low_stay_and_poll()
    test_watch_pending_report()
    test_course_health_scoring()
    test_mentor_rollup_groups_sessions()
    print("All course health tests passed.")
