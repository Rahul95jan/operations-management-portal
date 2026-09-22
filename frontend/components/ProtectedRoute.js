import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getToken, getStoredUser, setStoredUser, hasPermission, clearSession } from "../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function sectionLabel(section) {
  if (!section) return null;
  return section.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function AccessDenied({ section }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", background: "#0b0f12", color: "#f8fafc", fontFamily: "inherit" }}>
      <div style={{ fontSize: "48px" }}>🔒</div>
      <div style={{ fontSize: "22px", fontWeight: 800 }}>403 — Access Denied</div>
      <div style={{ fontSize: "13.5px", color: "#94a3b8", maxWidth: "360px", textAlign: "center" }}>
        You don&apos;t have permission to view {section ? `the ${sectionLabel(section)} section` : "this page"}. Contact your Super Admin if you believe this is a mistake.
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, permission }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking"); // checking | ok | denied

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Re-verify against the backend every time — permissions/role may have changed
      // since the token was issued, and a stale local copy must never grant access.
      try {
        const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          clearSession();
          if (!cancelled) router.push("/login");
          return;
        }
        const user = await res.json();
        setStoredUser(user);

        if (permission && !hasPermission(user, permission[0], permission[1] || "view")) {
          if (!cancelled) setStatus("denied");
          return;
        }
        if (!cancelled) setStatus("ok");
      } catch {
        // Backend unreachable — fall back to the last known permissions rather than
        // locking the user out over a transient network blip.
        const cached = getStoredUser();
        if (!cached) {
          router.push("/login");
          return;
        }
        if (permission && !hasPermission(cached, permission[0], permission[1] || "view")) {
          if (!cancelled) setStatus("denied");
          return;
        }
        if (!cancelled) setStatus("ok");
      }
    };

    check();
    return () => { cancelled = true; };
  }, [router.pathname]);

  if (status === "checking") {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f12",
          color: "#cbd5e1",
          fontFamily: "inherit",
          fontSize: "14px",
        }}
      >
        Checking your session…
      </div>
    );
  }
  if (status === "denied") return <AccessDenied section={permission?.[0]} />;
  return children;
}
