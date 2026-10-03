// The portal presents everything by Course. Underneath, records (sessions,
// invoices, NPS, resources, ...) still link to a Batch record by batch_name,
// and each Batch record carries the course_name it belongs to. These helpers
// translate between the two so pages can show / filter / save by course.

const norm = (value) => (value || "").trim().toLowerCase();

// { normalized batch_name -> course name } from the /batches list.
export function buildCourseByBatch(batches) {
  const map = {};
  (batches || []).forEach((b) => {
    if (b && b.batch_name) map[norm(b.batch_name)] = (b.course_name || b.batch_name).trim();
  });
  return map;
}

// The course for a record: its own course_name if it has one, otherwise the
// course of the batch it links to, otherwise the raw batch name.
export function courseOf(record, courseByBatch) {
  if (!record) return "";
  return (record.course_name || "").trim() || courseByBatch[norm(record.batch_name)] || (record.batch_name || "").trim();
}

// Same, for a bare batch name.
export function courseOfBatch(batchName, courseByBatch) {
  return courseByBatch[norm(batchName)] || (batchName || "").trim();
}

// Unique course names (case-insensitive), sorted.
export function uniqueCourses(names) {
  const seen = new Map();
  (names || []).forEach((n) => {
    const name = (n || "").trim();
    if (name && !seen.has(norm(name))) seen.set(norm(name), name);
  });
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function courseOptionsFromBatches(batches) {
  return uniqueCourses((batches || []).map((b) => b.course_name || b.batch_name));
}

// The Batch record to link when a course is picked: one named after the
// course (how the Courses page creates them), else an active one, else any.
export function batchForCourse(course, batches) {
  const matches = (batches || []).filter((b) => norm(b.course_name || b.batch_name) === norm(course));
  return (
    matches.find((b) => norm(b.batch_name) === norm(course)) ||
    matches.find((b) => b.status !== "Inactive") ||
    matches[0] ||
    null
  );
}

export function sameCourse(a, b) {
  return norm(a) === norm(b);
}
