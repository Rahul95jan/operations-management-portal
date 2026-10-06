"""Shared duration parsing/formatting for webinars, sessions, and payouts."""

from typing import Any, Optional, Union


def parse_duration_minutes(value: Any) -> float:
    """Parse HH:MM:SS, H:MM, plain minutes, or numeric values to decimal minutes."""
    if value is None or value == "":
        return 0.0

    if isinstance(value, (int, float)):
        minutes = float(value)
        return minutes if minutes > 0 else 0.0

    raw = str(value).strip()
    if not raw:
        return 0.0

    if ":" in raw:
        parts = [part.strip() for part in raw.split(":")]
        if not parts or any(part == "" for part in parts):
            return 0.0
        try:
            nums = [float(part) for part in parts]
        except ValueError:
            return 0.0

        if len(nums) == 3:
            hours, minutes, seconds = nums
            return hours * 60 + minutes + seconds / 60
        if len(nums) == 2:
            hours, minutes = nums
            return hours * 60 + minutes
        return 0.0

    try:
        minutes = float(raw)
    except ValueError:
        return 0.0
    return minutes if minutes > 0 else 0.0


def format_duration(value: Any) -> Optional[str]:
    """Format minutes or a time string as H:MM:SS (e.g. 80.5 -> 1:20:30)."""
    minutes = parse_duration_minutes(value)
    if minutes <= 0:
        return None

    total_seconds = round(minutes * 60)
    hours = total_seconds // 3600
    remainder = total_seconds % 3600
    mins = remainder // 60
    secs = remainder % 60
    return f"{hours}:{mins:02d}:{secs:02d}"


def is_valid_duration(value: Any) -> bool:
    """Empty values are allowed; non-empty values must parse to > 0 minutes."""
    if value is None or value == "":
        return True
    return parse_duration_minutes(value) > 0


def duration_to_billable_hours(value: Any) -> float:
    """Convert a duration to decimal hours rounded to two places for billing."""
    minutes = parse_duration_minutes(value)
    if minutes <= 0:
        return 0.0
    return round(minutes / 60, 2)
