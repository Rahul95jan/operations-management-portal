export default function SessionPicker({ sessions, selectedSession, onSelect }) {
  const handleChange = (e) => {
    const id = e.target.value;

    if (!id) {
      onSelect(null);
      return;
    }

    const session = sessions.find((s) => String(s.id) === id);
    onSelect(session || null);
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
        Session
      </label>

      <select
        value={selectedSession ? String(selectedSession.id) : ""}
        onChange={handleChange}
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1.5px solid #e2e8f0",
          fontSize: "14px",
        }}
      >
        <option value="">Select a session...</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.topic} — {s.batch_name} ({s.session_date})
          </option>
        ))}
      </select>

      {selectedSession && (
        <div
          style={{
            marginTop: "14px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
            background: "#f8fafc",
            borderRadius: "10px",
            padding: "14px 16px",
          }}
        >
          <Field label="Session Date" value={selectedSession.session_date} />
          <Field label="Course" value={selectedSession.course_name} />
          <Field label="Batch" value={selectedSession.batch_name} />
          <Field label="Mentor" value={selectedSession.mentor_name} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>
        {value || "—"}
      </div>
    </div>
  );
}
