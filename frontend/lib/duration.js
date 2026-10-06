/**
 * Shared duration helpers for webinars, sessions, and invoice generation.
 * Supports HH:MM:SS ("1:20:30"), H:MM ("1:30"), plain minutes ("90", 90, 80.5).
 */

function formatMinutesToHms(minutes) {
  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const remainder = totalSeconds % 3600;
  const mins = Math.floor(remainder / 60);
  const secs = remainder % 60;
  return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** Parse a duration value into decimal minutes. */
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

/** Format minutes or a raw time string as H:MM:SS (e.g. 80.5 → 1:20:30). */
export function formatDuration(value) {
  const minutes = parseDurationToMinutes(value);
  if (!minutes) return null;
  return formatMinutesToHms(minutes);
}

/** Empty values are allowed; non-empty values must parse to > 0 minutes. */
export function isValidDuration(value) {
  if (value === null || value === undefined || value === "") return true;
  return parseDurationToMinutes(value) > 0;
}

/** True when a duration is present and greater than zero. */
export function hasDuration(value) {
  return parseDurationToMinutes(value) > 0;
}

/** Round to two decimal places for invoice hour fields. */
export function roundHours(hours) {
  if (!Number.isFinite(hours)) return 0;
  return Math.round(hours * 100) / 100;
}

/** Display label for session lists/drawers. */
export function formatSessionDuration(value) {
  return formatDuration(value);
}
