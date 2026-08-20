const API = "http://127.0.0.1:8000";

export default function ResourceActions({ resource }) {
  const hasFile = Boolean(resource.file_path);
  const hasUrl = Boolean(resource.resource_url);

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {hasUrl && (
        <a href={resource.resource_url} target="_blank" rel="noreferrer">
          <ActionButton label="Open ↗" color="#2563eb" />
        </a>
      )}

      {hasFile && (
        <>
          <a href={`${API}/resources/${resource.id}/preview`} target="_blank" rel="noreferrer">
            <ActionButton label="Preview" color="#0891b2" />
          </a>
          <a href={`${API}/resources/${resource.id}/download`}>
            <ActionButton label="Download" color="#16a34a" />
          </a>
          <a href={`${API}/resources/${resource.id}/download-lms`}>
            <ActionButton label="Download for LMS" color="#0f172a" textColor="#facc15" />
          </a>
        </>
      )}
    </div>
  );
}

function ActionButton({ label, color, textColor = "#fff" }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: color,
        color: textColor,
        padding: "6px 12px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </span>
  );
}
