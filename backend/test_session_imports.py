#!/usr/bin/env python3
"""Smoke-test Zoom CSV parsing for session report imports (no DB required)."""

import csv
import io
import sys

sys.path.insert(0, "/workspace/backend")

from main import (
    read_import_table,
    parse_poll_report,
    aggregate_zoom_learners,
    compute_poll_health_status,
    decode_csv_bytes,
)


def test_attendance():
    path = "/workspace/test-data/attendee_84582647707_2026_10_03_e6aa.csv"
    with open(path, "rb") as f:
        contents = f.read()
    df, summary = read_import_table(contents, "attendee.csv")
    aggregated, skipped, _ = aggregate_zoom_learners(df, allow_name_key=True)

    assert summary["total_participants"] == "511" or summary.get("unique_viewers") == "511" or str(summary.get("total_participants")) == "511"
    assert summary["total_users"] == "792"
    assert summary["max_concurrent_views"] == "371"
    assert summary["duration_minutes"] == "245"
    assert len(aggregated) == 3, f"expected 3 unique learners, got {len(aggregated)}"
    assert skipped == 0
    print("attendance parse OK:", summary, "learners=", len(aggregated))


def test_poll():
    path = "/workspace/test-data/poll_84582647707_2026_10_03_78e3.csv"
    with open(path, "rb") as f:
        text = decode_csv_bytes(f.read())
    raw_rows = list(csv.reader(io.StringIO(text)))
    result = parse_poll_report(raw_rows)
    health = compute_poll_health_status(result["poll_average_rating"])

    assert result["polls_conducted"] == 1
    assert result["poll_responses"] == 2  # sample has 2 response rows
    assert result["poll_average_rating"] >= 4.3
    assert health == "Good"
    print("poll parse OK:", result["poll_average_rating"], health)


if __name__ == "__main__":
    test_attendance()
    test_poll()
    print("All parsing tests passed.")
