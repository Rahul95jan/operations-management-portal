const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem("loggedIn", "true");
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("loggedIn");
}

export function isSuperAdmin(user) {
  return user?.role === "SUPER_ADMIN";
}

export function hasPermission(user, section, action = "view") {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return (user.permissions || []).includes(`${section}.${action}`);
}

let fetchPatched = false;

// Patches the global fetch ONCE so every existing `fetch(url)` call across the whole app
// (none of which know about auth) automatically sends the bearer token to our own API.
// This is what lets backend permission enforcement work without editing every page.
export function installAuthFetch() {
  if (fetchPatched || typeof window === "undefined") return;
  fetchPatched = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.startsWith(API)) {
      const token = getToken();
      if (token) {
        const headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined));
        if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
        return originalFetch(input, { ...init, headers });
      }
    }
    return originalFetch(input, init);
  };
}

export async function apiLogin(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Invalid username or password.");
  }
  return res.json();
}
