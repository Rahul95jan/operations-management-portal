import { RESOURCE_TYPES, typeConfig } from "./resourceTypes";
import { RESOURCE_CATEGORIES } from "./resourceCategories";

export default function ResourceRow({ row, index, onChange, onRemove, canRemove }) {
  const config = typeConfig(row.resource_type);
  const showUrl = !config || config.kind === "url" || config.kind === "both";
  const showFile = config && (config.kind === "file" || config.kind === "both");

  return (
    <div
      style={{
        border: "1.5px solid #e2e8f0",
        borderRadius: "12px",
        padding: "18px",
        marginBottom: "16px",
        position: "relative",
        background: row.result?.success ? "#f0fdf4" : "#fff",
      }}
    >
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      )}

      <div style={{ fontWeight: 700, color: "#64748b", fontSize: "12px", marginBottom: "12px" }}>
        RESOURCE {index + 1}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <div>
          <label style={labelStyle}>Resource Category</label>
          <select
            value={row.resource_category || ""}
            onChange={(e) => onChange("resource_category", e.target.value)}
            style={inputStyle}
          >
            <option value="">Select category...</option>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Resource Type</label>
          <select
            value={row.resource_type}
            onChange={(e) => onChange("resource_type", e.target.value)}
            style={inputStyle}
          >
            <option value="">Select type...</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Resource Title</label>
        <input
          type="text"
          value={row.resource_title}
          onChange={(e) => onChange("resource_title", e.target.value)}
          placeholder="e.g. RAG Session Slides"
          style={inputStyle}
        />
      </div>

      {(showUrl || showFile) && (
        <div style={{ display: "grid", gridTemplateColumns: showUrl && showFile ? "1fr 1fr" : "1fr", gap: "14px", marginBottom: "14px" }}>
          {showUrl && (
            <div>
              <label style={labelStyle}>Resource URL</label>
              <input
                type="url"
                value={row.resource_url}
                onChange={(e) => onChange("resource_url", e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>
          )}

          {showFile && (
            <div>
              <label style={labelStyle}>File Upload</label>
              <input
                type="file"
                onChange={(e) => onChange("file", e.target.files[0] || null)}
                style={{ ...inputStyle, padding: "6px" }}
              />
            </div>
          )}
        </div>
      )}

      <div>
        <label style={labelStyle}>Description / Notes</label>
        <textarea
          rows="2"
          value={row.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Optional notes about this resource..."
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {row.result && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            background: row.result.success ? "#dcfce7" : "#fee2e2",
            color: row.result.success ? "#166534" : "#991b1b",
          }}
        >
          {row.result.success ? "✓ " : "✕ "}
          {row.result.message}
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#475569",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 11px",
  borderRadius: "8px",
  border: "1.5px solid #e2e8f0",
  fontSize: "14px",
};
