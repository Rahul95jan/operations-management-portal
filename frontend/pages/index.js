import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

export default function Home() {
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "admin@example.com",
    password: "AdminPass123",
  });

  async function loadUsers(currentToken = token) {
    if (!currentToken) return;

    const response = await fetch(`${API_BASE}/users/`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to load users" }));
      throw new Error(error.detail || "Failed to load users");
    }

    const data = await response.json();
    setUsers(data);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      setToken(data.access_token);
      await loadUsers(data.access_token);
      setMessage("Admin logged in successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId) {
    if (!token) {
      setMessage("Please log in as an admin first.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "User could not be deleted");
      }

      setMessage(data.message || "User deleted successfully.");
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (token) {
      loadUsers(token).catch((error) => setMessage(error.message));
    }
  }, [token]);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif", maxWidth: "980px", margin: "0 auto" }}>
      <h1>Operations Management Portal</h1>

      <section style={{ marginBottom: "30px", padding: "20px", border: "1px solid #ddd", borderRadius: "10px" }}>
        <h2>User Management</h2>

        <form onSubmit={handleLogin} style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <input
            type="email"
            value={loginForm.email}
            onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
            placeholder="Admin email"
            style={{ padding: "10px 12px", minWidth: "220px" }}
          />
          <input
            type="password"
            value={loginForm.password}
            onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
            placeholder="Password"
            style={{ padding: "10px 12px", minWidth: "220px" }}
          />
          <button type="submit" disabled={loading} style={{ padding: "10px 18px", cursor: "pointer" }}>
            {loading ? "Logging in..." : "Login as admin"}
          </button>
        </form>

        {message ? <p style={{ color: message.includes("success") || message.includes("deleted") ? "green" : "crimson" }}>{message}</p> : null}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f4f4f4" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Role</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Hourly Rate</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "16px", color: "#666" }}>
                  {token ? "No users found." : "Log in as an admin to manage users."}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td style={{ padding: "12px" }}>{user.name}</td>
                  <td style={{ padding: "12px" }}>{user.email}</td>
                  <td style={{ padding: "12px" }}>{user.role}</td>
                  <td style={{ padding: "12px" }}>{user.hourly_rate}</td>
                  <td style={{ padding: "12px" }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={!token || user.id === 1}
                      style={{ padding: "8px 12px", background: user.id === 1 ? "#ddd" : "#d93025", color: "white", border: "none", borderRadius: "6px", cursor: user.id === 1 ? "not-allowed" : "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}