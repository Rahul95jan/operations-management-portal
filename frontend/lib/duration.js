/**
 * Parse a session duration into minutes.
 * Supports HH:MM:SS ("1:20:30"), H:MM ("1:30"), and plain minutes ("90", 90).
 */
export function parseDurationToMinutes(value) {
  if (value === null || value === undefined || value === "") return 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  if (raw.includes(":")) {
    const parts = raw.split(":").map((part) => part.trim());
    if (parts.some((part) => part === "" || Number.isNaN(Number(part)))) return 0;

    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts.map(Number);
      return hours * 60 + minutes + seconds / 60;
    }

    if (parts.length === 2) {
      const [hours, minutes] = parts.map(Number);
      return hours * 60 + minutes;
    }

    return 0;
  }

  const minutes = Number(raw);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

/** Parse duration to decimal hours (e.g. 1:20:30 → ~1.34). */
export function parseDurationToHours(value) {
  return parseDurationToMinutes(value) / 60;
}

export function hasDuration(value) {
  return parseDurationToMinutes(value) > 0;
}

/** Round to two decimal places for invoice hour fields. */
export function roundHours(hours) {
  if (!Number.isFinite(hours)) return 0;
  return Math.round(hours * 100) / 100;
}

/** Display label: keep time strings as-is, append "min" for plain minute values. */
export function formatSessionDuration(value) {
  if (value === null || value === undefined || value === "") return null;

  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.includes(":")) return raw;

  const minutes = parseDurationToMinutes(raw);
  return minutes ? `${minutes} min` : null;
}
