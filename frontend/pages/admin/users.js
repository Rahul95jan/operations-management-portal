import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { getStoredUser } from "../../lib/auth";
import { UserPlus, Shield, X, Check, AlertTriangle, Eye, Settings2 } from "lucide-react";

const API = "http://127.0.0.1:8000";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

const OPERATIONAL_SECTIONS = ["dashboard", "sessions", "mentors", "batches"];

function emptyPermState(catalog) {
  const state = {};
  Object.keys(catalog || {}).forEach((s) => { state[s] = { checked: false, actions: {} }; });
  return state;
}

function permsToState(catalog, permsList) {
  const state = emptyPermState(catalog);
  (permsList || []).forEach((p) => {
    const [section, action] = p.split(".");
    if (!state[section]) return;
    state[section].checked = true;
    state[section].actions[action] = true;
  });
  return state;
}

function stateToPerms(state) {
  const out = [];
  Object.entries(state).forEach(([section, v]) => {
    if (!v.checked) return;
    Object.entries(v.actions).forEach(([action, on]) => { if (on) out.push(`${section}.${action}`); });
  });
  return out;
}

export default function UserManagement() {
  const me = getStoredUser();
  const [users, setUsers] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [manageTarget, setManageTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // {user, action}

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, cRes] = await Promise.all([fetch(`${API}/admin/users`), fetch(`${API}/auth/permission-catalog`)]);
      if (!uRes.ok) throw new Error("Failed to load users.");
      setUsers(await uRes.json());
      const c = await cRes.json();
      setCatalog(c.assignable_sections);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const accessSummary = (u) => {
    if (u.role === "SUPER_ADMIN") return "Full Access";
    const sections = new Set((u.permissions || []).map((p) => p.split(".")[0]));
    return `${sections.size} Section${sections.size === 1 ? "" : "s"}`;
  };

  return (
    <ProtectedRoute permission={["user_management", "view"]}>
      <Sidebar />
      <div style={{ marginLeft: "var(--om-sidebar-width, 280px)", transition: "margin-left 0.25s ease", padding: "28px 32px 56px", background: "var(--om-bg-page)", minHeight: "100vh" }}>
        <Header />

        <div className="page-head">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-sub">Control who can sign in and exactly which sections of the portal they can reach.</p>
          </div>
          <button className="primary-btn" onClick={() => setShowCreate(true)}><UserPlus size={15} strokeWidth={2.3} /> Add New User</button>
        </div>

        <div className="card">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : error ? (
            <div className="empty-state">{error}</div>
          ) : (
            <div className="table-wrap">
              <table className="users-table">
                <thead>
                  <tr><th>User</th><th>Email</th><th>Role</th><th>Access</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="avatar">{initials(u.name)}</div>
                          <span className="strong">{u.name}</span>
                        </div>
                      </td>
                      <td className="muted">{u.email}</td>
                      <td><span className={`role-badge role-${u.role === "SUPER_ADMIN" ? "super" : "admin"}`}>{u.role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}</span></td>
                      <td>
                        <button className="access-link" onClick={() => setViewTarget(u)}><Eye size={12} strokeWidth={2.3} /> {accessSummary(u)}</button>
                      </td>
                      <td><span className={`status-badge status-${u.is_active ? "active" : "inactive"}`}>{u.is_active ? "Active" : "Deactivated"}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          {u.role !== "SUPER_ADMIN" && (
                            <button className="row-btn" onClick={() => setManageTarget(u)}><Settings2 size={12} strokeWidth={2.3} /> Manage Access</button>
                          )}
                          {u.id !== me?.id && (
                            <button className="row-btn row-btn-danger" onClick={() => setConfirmTarget({ user: u, action: u.is_active ? "deactivate" : "activate" })}>
                              {u.is_active ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && catalog && (
        <CreateUserModal
          catalog={catalog}
          onClose={() => setShowCreate(false)}
          onCreated={(u) => { setUsers((prev) => [...prev, u]); setShowCreate(false); showToast(`${u.name} was added as ${u.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}.`); }}
        />
      )}

      {manageTarget && catalog && (
        <ManageAccessDrawer
          user={manageTarget}
          catalog={catalog}
          onClose={() => setManageTarget(null)}
          onSaved={(u) => { setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x))); setManageTarget(null); showToast(`Access updated for ${u.name}.`); }}
        />
      )}

      {viewTarget && catalog && (
        <ViewAccessModal user={viewTarget} catalog={catalog} onClose={() => setViewTarget(null)} />
      )}

      {confirmTarget && (
        <ConfirmModal
          title={`${confirmTarget.action === "deactivate" ? "Deactivate" : "Activate"} ${confirmTarget.user.name}?`}
          message={confirmTarget.action === "deactivate"
            ? `${confirmTarget.user.name} will immediately lose access to the portal.`
            : `${confirmTarget.user.name} will be able to sign in again.`}
          confirmLabel={confirmTarget.action === "deactivate" ? "Deactivate" : "Activate"}
          danger={confirmTarget.action === "deactivate"}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={async () => {
            try {
              const res = await fetch(`${API}/admin/users/${confirmTarget.user.id}/access`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: confirmTarget.action === "activate" }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.detail || "Failed to update user.");
              setUsers((prev) => prev.map((x) => (x.id === data.id ? data : x)));
              showToast(`${data.name} is now ${data.is_active ? "active" : "deactivated"}.`);
            } catch (err) {
              showToast(err.message, "error");
            } finally {
              setConfirmTarget(null);
            }
          }}
        />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <style jsx>{`
        .page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
        .page-title { font-size: 24px; font-weight: 800; color: var(--om-text-primary); margin: 0 0 4px; }
        .page-sub { font-size: 13px; color: var(--om-text-muted); margin: 0; max-width: 520px; }
        .primary-btn { display: flex; align-items: center; gap: 8px; background: linear-gradient(120deg, #f0c75e, #d4a72c); color: var(--om-bg-page); border: none; border-radius: 9px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .primary-btn:hover { transform: translateY(-1px); }
        :global(.card) { background: var(--om-bg-card); border-radius: 14px; padding: 8px; border: 1px solid var(--om-border-2); }
        .table-wrap { overflow-x: auto; }
        .users-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .users-table th { text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--om-text-faint); padding: 12px 14px; border-bottom: 1px solid var(--om-border-2); }
        .users-table td { padding: 12px 14px; border-bottom: 1px solid var(--om-border-4); color: var(--om-text-body); }
        .avatar { width: 30px; height: 30px; border-radius: 50%; background: rgba(240,199,94,0.16); color: #f0c75e; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
        .strong { font-weight: 600; color: var(--om-text-strong); }
        .muted { color: var(--om-text-faint); }
        .role-badge { font-size: 10.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
        .role-super { background: rgba(240,199,94,0.14); color: #f0c75e; }
        .role-admin { background: rgba(96,165,250,0.14); color: #60a5fa; }
        .status-badge { font-size: 10.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
        .status-active { background: rgba(74,222,128,0.12); color: #4ade80; }
        .status-inactive { background: rgba(148,163,184,0.14); color: var(--om-text-muted); }
        .access-link { display: inline-flex; align-items: center; gap: 5px; background: transparent; border: none; color: var(--om-text-body); font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0; }
        .access-link:hover { color: #f0c75e; }
        .row-btn { background: var(--om-border-3); border: 1px solid var(--om-border-1); color: var(--om-text-body); font-size: 11.5px; font-weight: 600; padding: 6px 10px; border-radius: 7px; cursor: pointer; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
        .row-btn:hover { border-color: rgba(240,199,94,0.4); color: #f0c75e; }
        .row-btn-danger:hover { border-color: rgba(248,113,113,0.4); color: #f87171; }
        .empty-state { text-align: center; padding: 40px; color: var(--om-text-faint); font-size: 13px; }
        .toast { position: fixed; bottom: 24px; right: 24px; background: var(--om-bg-card); border: 1px solid var(--om-border-strong); color: #f1f5f9; padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; box-shadow: 0 12px 30px -12px rgba(0,0,0,0.6); z-index: 100; }
        .toast-error { border-color: rgba(248,113,113,0.4); color: #f87171; }
      `}</style>
    </ProtectedRoute>
  );
}

function PermissionTree({ catalog, state, setState, disabledSections = [] }) {
  const toggleSection = (section) => {
    setState((prev) => {
      const next = { ...prev, [section]: { ...prev[section] } };
      const checked = !prev[section].checked;
      next[section].checked = checked;
      if (checked && Object.keys(next[section].actions).length === 0) {
        next[section].actions = { view: true };
      }
      if (!checked) next[section].actions = {};
      return next;
    });
  };

  const toggleAction = (section, action) => {
    setState((prev) => {
      const actions = { ...prev[section].actions, [action]: !prev[section].actions[action] };
      const anyOn = Object.values(actions).some(Boolean);
      return { ...prev, [section]: { checked: anyOn, actions } };
    });
  };

  return (
    <div className="perm-tree">
      {Object.entries(catalog).map(([section, meta]) => (
        <div key={section} className="perm-section">
          <label className="perm-row perm-row-section">
            <input type="checkbox" checked={state[section]?.checked || false} onChange={() => toggleSection(section)} disabled={disabledSections.includes(section)} />
            <span>{meta.label}</span>
          </label>
          {state[section]?.checked && (
            <div className="perm-actions">
              {meta.actions.map((action) => (
                <label key={action} className="perm-row perm-row-action">
                  <input type="checkbox" checked={!!state[section].actions[action]} onChange={() => toggleAction(section, action)} />
                  <span>{action[0].toUpperCase() + action.slice(1)}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      <style jsx>{`
        .perm-tree { display: flex; flex-direction: column; gap: 4px; }
        .perm-row { display: flex; align-items: center; gap: 9px; font-size: 13px; color: var(--om-text-strong); padding: 7px 4px; cursor: pointer; }
        .perm-row input { accent-color: #f0c75e; width: 15px; height: 15px; cursor: pointer; }
        .perm-row-section { font-weight: 700; }
        .perm-actions { display: flex; flex-direction: column; padding-left: 24px; border-left: 2px solid var(--om-border-2); margin: 0 0 6px 7px; }
        .perm-row-action { font-size: 12.5px; color: var(--om-text-muted); padding: 5px 4px; }
      `}</style>
    </div>
  );
}

function CreateUserModal({ catalog, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [permState, setPermState] = useState(() => emptyPermState(catalog));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const applyOperational = () => {
    setPermState((prev) => {
      const next = { ...prev };
      OPERATIONAL_SECTIONS.forEach((s) => {
        if (!next[s]) return;
        next[s] = { checked: true, actions: Object.fromEntries(catalog[s].actions.map((a) => [a, a === "view"])) };
      });
      return next;
    });
  };
  const selectAll = () => {
    setPermState(() => {
      const next = {};
      Object.entries(catalog).forEach(([s, meta]) => { next[s] = { checked: true, actions: Object.fromEntries(meta.actions.map((a) => [a, true])) }; });
      return next;
    });
  };
  const clearAll = () => setPermState(emptyPermState(catalog));

  const submit = async () => {
    setError(null);
    if (!name || !email || !username || !password) { setError("All fields are required."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, username, password, role, permissions: stateToPerms(permState) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create user.");
      onCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title"><UserPlus size={17} strokeWidth={2.3} /> Add New User</div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

          <div className="field-row">
            <div className="field"><label>Full Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amit Verma" /></div>
            <div className="field"><label>Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. amit" /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Email Address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amit@example.com" /></div>
            <div className="field"><label>Temporary Password</label><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set an initial password" /></div>
          </div>

          <div className="field">
            <label>Role</label>
            <div className="role-radio-row">
              <label className={`role-radio ${role === "ADMIN" ? "role-radio-active" : ""}`}>
                <input type="radio" name="role" checked={role === "ADMIN"} onChange={() => setRole("ADMIN")} /> ADMIN
              </label>
              <label className={`role-radio ${role === "SUPER_ADMIN" ? "role-radio-active" : ""}`}>
                <input type="radio" name="role" checked={role === "SUPER_ADMIN"} onChange={() => setRole("SUPER_ADMIN")} /> SUPER_ADMIN
              </label>
            </div>
          </div>

          {role === "SUPER_ADMIN" ? (
            <div className="super-admin-note">
              <Shield size={16} strokeWidth={2.2} />
              <div>
                <div className="strong">Full Portal Access</div>
                <div className="muted">Super Admin has unrestricted access to all portal sections and administrative controls.</div>
              </div>
            </div>
          ) : (
            <div className="field">
              <div className="perm-header">
                <label>Portal Access</label>
                <div className="perm-shortcuts">
                  <button type="button" onClick={applyOperational}>Operational Access</button>
                  <button type="button" onClick={selectAll}>Select All</button>
                  <button type="button" onClick={clearAll}>Clear All</button>
                </div>
              </div>
              <PermissionTree catalog={catalog} state={permState} setState={setPermState} />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? "Creating…" : "Create User"}</button>
        </div>
      </div>

      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
        .modal { background: var(--om-bg-card); border: 1px solid var(--om-border-1); border-radius: 16px; width: 100%; max-width: 560px; max-height: 88vh; display: flex; flex-direction: column; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--om-border-2); }
        .modal-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: var(--om-text-primary); }
        .icon-btn { background: transparent; border: none; color: var(--om-text-muted); cursor: pointer; }
        .modal-body { padding: 18px 20px; overflow-y: auto; flex: 1; }
        .form-error { display: flex; align-items: center; gap: 7px; background: rgba(248,113,113,0.1); color: #f87171; font-size: 12.5px; font-weight: 600; padding: 9px 12px; border-radius: 8px; margin-bottom: 14px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 11px; font-weight: 700; color: var(--om-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
        .field input { width: 100%; box-sizing: border-box; background: var(--om-bg-page); border: 1px solid var(--om-border-1); border-radius: 8px; padding: 9px 11px; color: #f1f5f9; font-size: 13px; outline: none; }
        .field input:focus { border-color: rgba(240,199,94,0.5); }
        .role-radio-row { display: flex; gap: 10px; }
        .role-radio { display: flex; align-items: center; gap: 7px; border: 1px solid var(--om-border-1); border-radius: 8px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; color: var(--om-text-muted); cursor: pointer; }
        .role-radio input { accent-color: #f0c75e; }
        .role-radio-active { border-color: rgba(240,199,94,0.4); color: #f0c75e; background: rgba(240,199,94,0.06); }
        .super-admin-note { display: flex; gap: 12px; background: rgba(240,199,94,0.06); border: 1px solid rgba(240,199,94,0.18); border-radius: 10px; padding: 14px; color: #f0c75e; }
        .super-admin-note .strong { font-weight: 700; color: #f0c75e; margin-bottom: 3px; }
        .super-admin-note .muted { color: var(--om-text-muted); font-size: 12px; line-height: 1.5; }
        .perm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .perm-shortcuts { display: flex; gap: 8px; }
        .perm-shortcuts button { background: var(--om-border-3); border: 1px solid var(--om-border-1); color: var(--om-text-body); font-size: 10.5px; font-weight: 700; padding: 5px 9px; border-radius: 6px; cursor: pointer; }
        .perm-shortcuts button:hover { color: #f0c75e; border-color: rgba(240,199,94,0.3); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--om-border-2); }
        .btn-secondary { background: transparent; border: 1px solid var(--om-border-strong); color: var(--om-text-body); padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-primary { background: linear-gradient(120deg, #f0c75e, #d4a72c); border: none; color: var(--om-bg-page); padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function ManageAccessDrawer({ user, catalog, onClose, onSaved }) {
  const [permState, setPermState] = useState(() => permsToState(catalog, user.permissions));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const applyOperational = () => {
    setPermState((prev) => {
      const next = { ...prev };
      OPERATIONAL_SECTIONS.forEach((s) => {
        if (!next[s]) return;
        next[s] = { checked: true, actions: Object.fromEntries(catalog[s].actions.map((a) => [a, a === "view"])) };
      });
      return next;
    });
  };
  const selectAll = () => {
    setPermState(() => {
      const next = {};
      Object.entries(catalog).forEach(([s, meta]) => { next[s] = { checked: true, actions: Object.fromEntries(meta.actions.map((a) => [a, true])) }; });
      return next;
    });
  };
  const clearAll = () => setPermState(emptyPermState(catalog));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/users/${user.id}/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: stateToPerms(permState) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save access.");
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title"><Settings2 size={17} strokeWidth={2.3} /> Manage Access — {user.name}</div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
          <div className="role-line">Role: <b>{user.role}</b></div>
          <div className="perm-header">
            <label>Portal Sections</label>
            <div className="perm-shortcuts">
              <button type="button" onClick={applyOperational}>Operational Access</button>
              <button type="button" onClick={selectAll}>Select All</button>
              <button type="button" onClick={clearAll}>Clear All</button>
            </div>
          </div>
          <PermissionTree catalog={catalog} state={permState} setState={setPermState} />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Access"}</button>
        </div>
      </div>

      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: flex-end; z-index: 200; }
        .drawer { background: var(--om-bg-card); border-left: 1px solid var(--om-border-1); width: 100%; max-width: 420px; height: 100%; display: flex; flex-direction: column; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--om-border-2); }
        .modal-title { display: flex; align-items: center; gap: 8px; font-size: 14.5px; font-weight: 700; color: var(--om-text-primary); }
        .icon-btn { background: transparent; border: none; color: var(--om-text-muted); cursor: pointer; }
        .modal-body { padding: 18px 20px; overflow-y: auto; flex: 1; }
        .role-line { font-size: 13px; color: var(--om-text-body); margin-bottom: 16px; }
        .role-line b { color: #f0c75e; }
        .form-error { display: flex; align-items: center; gap: 7px; background: rgba(248,113,113,0.1); color: #f87171; font-size: 12.5px; font-weight: 600; padding: 9px 12px; border-radius: 8px; margin-bottom: 14px; }
        .perm-header { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
        .perm-header label { font-size: 11px; font-weight: 700; color: var(--om-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .perm-shortcuts { display: flex; gap: 8px; flex-wrap: wrap; }
        .perm-shortcuts button { background: var(--om-border-3); border: 1px solid var(--om-border-1); color: var(--om-text-body); font-size: 10.5px; font-weight: 700; padding: 5px 9px; border-radius: 6px; cursor: pointer; }
        .perm-shortcuts button:hover { color: #f0c75e; border-color: rgba(240,199,94,0.3); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--om-border-2); }
        .btn-secondary { background: transparent; border: 1px solid var(--om-border-strong); color: var(--om-text-body); padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-primary { background: linear-gradient(120deg, #f0c75e, #d4a72c); border: none; color: var(--om-bg-page); padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function ViewAccessModal({ user, catalog, onClose }) {
  const granted = Object.entries(catalog).filter(([s]) => (user.permissions || []).some((p) => p.startsWith(`${s}.`)));
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Access — {user.name}</div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {user.role === "SUPER_ADMIN" ? (
            <div className="full-access"><Shield size={16} /> Full Portal Access</div>
          ) : granted.length === 0 ? (
            <div className="muted">No sections granted yet.</div>
          ) : (
            <div className="access-list">
              {granted.map(([s, meta]) => (
                <div key={s} className="access-item"><Check size={13} color="#4ade80" /> {meta.label}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
        .modal-sm { background: var(--om-bg-card); border: 1px solid var(--om-border-1); border-radius: 14px; width: 100%; max-width: 340px; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--om-border-2); }
        .modal-title { font-size: 14px; font-weight: 700; color: var(--om-text-primary); }
        .icon-btn { background: transparent; border: none; color: var(--om-text-muted); cursor: pointer; }
        .modal-body { padding: 16px 18px; }
        .full-access { display: flex; align-items: center; gap: 8px; color: #f0c75e; font-weight: 700; font-size: 13px; }
        .muted { color: var(--om-text-faint); font-size: 13px; }
        .access-list { display: flex; flex-direction: column; gap: 9px; }
        .access-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--om-text-strong); }
      `}</style>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, danger, onCancel, onConfirm }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <div className="confirm-icon"><AlertTriangle size={22} color={danger ? "#f87171" : "#f0c75e"} /></div>
          <div className="confirm-title">{title}</div>
          <div className="confirm-msg">{message}</div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 210; padding: 20px; }
        .modal-sm { background: var(--om-bg-card); border: 1px solid var(--om-border-1); border-radius: 14px; width: 100%; max-width: 360px; text-align: center; }
        .modal-body { padding: 26px 20px 10px; }
        .confirm-icon { margin-bottom: 12px; }
        .confirm-title { font-size: 15px; font-weight: 700; color: var(--om-text-primary); margin-bottom: 6px; }
        .confirm-msg { font-size: 13px; color: var(--om-text-muted); line-height: 1.5; }
        .modal-footer { display: flex; justify-content: center; gap: 10px; padding: 18px 20px 20px; }
        .btn-secondary { background: transparent; border: 1px solid var(--om-border-strong); color: var(--om-text-body); padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-primary { background: linear-gradient(120deg, #f0c75e, #d4a72c); border: none; color: var(--om-bg-page); padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .btn-danger { background: linear-gradient(120deg, #f87171, #ef4444); border: none; color: #fff; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
      `}</style>
    </div>
  );
}
