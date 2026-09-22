import { typeConfig } from "../resourceTypes";

export const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// The backend stores naive UTC timestamps (datetime.utcnow) with no zone marker.
// Parse them as UTC so they display in the viewer's local time.
export function parseServerDate(value) {
  if (!value) return null;
  const text = String(value);
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(text);
  const date = new Date(hasZone ? text : `${text}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const d = parseServerDate(value);
  return d ? d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export function formatTime(value) {
  const d = parseServerDate(value);
  return d ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";
}

// "2d 4h" / "5h" / "30m" for a positive number of milliseconds.
export function formatDuration(ms) {
  const minutes = Math.max(Math.round(ms / 60000), 0);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function typeLabel(value) {
  return typeConfig(value)?.label || value || "Resource";
}

export function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

// Same endpoint the Mentors page uploads to; ?v busts the cache on a new photo.
export function mentorPhotoUrl(mentor) {
  if (!mentor || !mentor.photo_path) return null;
  return `${API}/mentors/${mentor.id}/photo?v=${encodeURIComponent(mentor.photo_path)}`;
}

export function userPhotoUrl(user) {
  if (!user || !user.photo_path) return null;
  return `${API}/users/${user.id}/photo?v=${encodeURIComponent(user.photo_path)}`;
}

// Backend requirement/tracking status -> what the mentor sees.
//   Complete  -> Submitted   (everything in, on time)
//   Delayed   -> Late        (everything in, but after the deadline)
//   Overdue   -> Overdue     (deadline passed, still missing)
//   Pending / Partially Submitted -> waiting on the mentor
export const DISPLAY_STATUS = {
  Complete: "Submitted",
  Delayed: "Late",
  Overdue: "Overdue",
  Pending: "Pending",
  "Partially Submitted": "Partially Submitted",
  "Not Required": "Not Required",
};

export function displayStatus(status) {
  return DISPLAY_STATUS[status] || status || "Unknown";
}

// Which tracker tab a backend status belongs to.
export function tabForStatus(status) {
  switch (status) {
    case "Complete":
      return "Submitted";
    case "Delayed":
      return "Late";
    case "Overdue":
      return "Overdue";
    case "Pending":
    case "Partially Submitted":
      return "Pending";
    default:
      return null;
  }
}

// File extensions accepted for each "file" resource type, so a mentor can't
// file a PPT under "PDF" (the backend matches requirements by type).
export const FILE_ACCEPT = {
  pdf: ".pdf",
  image: ".jpg,.jpeg,.png",
  ppt: ".ppt,.pptx",
  doc: ".doc,.docx",
  xls: ".xls,.xlsx",
  zip: ".zip",
};

export function fileMatchesType(file, typeValue) {
  const accept = FILE_ACCEPT[typeValue];
  if (!accept) return true;
  const name = (file.name || "").toLowerCase();
  return accept.split(",").some((ext) => name.endsWith(ext));
}

// Session types as stored on the session record (default "Live Session").
export const SESSION_TYPES = [
  { value: "Live Session", label: "Live Session" },
  { value: "Webinar Session", label: "Webinar" },
];

export function sessionTypeOf(session) {
  return session?.session_type || "Live Session";
}

export function sessionTypeLabel(value) {
  return SESSION_TYPES.find((t) => t.value === value)?.label || value || "Live Session";
}

// Webinar sessions are created without a batch, so the upload form offers "No batch".
export const NO_BATCH = "__none__";
