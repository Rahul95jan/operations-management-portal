import StatusBadge from "./StatusBadge";
import { typeConfig } from "./resourceTypes";

export default function SubmittedResourcesList({ resources }) {
  if (resources.length === 0) {
    return (
      <p style={{ color: "#94a3b8", fontSize: "14px" }}>
        No resources submitted for this session yet.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {resources.map((r) => {
        const config = typeConfig(r.resource_type);

        return (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>{config?.icon || "📎"}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{r.resource_title}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {config?.label || r.resource_type} · Submitted{" "}
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {r.resource_url && (
                <a href={r.resource_url} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#2563eb" }}>
                  Open ↗
                </a>
              )}
              {r.file_name && (
                <span style={{ fontSize: "13px", color: "#64748b" }}>{r.file_name}</span>
              )}
              <StatusBadge status={r.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
