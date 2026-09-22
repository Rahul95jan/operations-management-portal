import { useEffect, useState } from "react";

const THEME_KEY = "omTheme"; // "dark" | "light"
const THEME_EVENT = "om-theme-change";

// Pages that were built with their own dark styling (Home/Profile/Admin read the
// --om-* variables in styles/theme.css; Login and the public NPS form are
// always-dark designs). Every other page was designed light-only,
// so in dark mode it gets the portal-wide dark treatment in styles/theme.css.
// Keep in sync with the inline script in pages/_document.js.
export function isThemeNativePath(pathname = "") {
  return pathname === "/" || pathname === "/login" || pathname === "/nps" || pathname === "/profile" || pathname.startsWith("/admin/");
}

export function getStoredTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

// Marks <html> when the current page needs the portal-wide dark treatment.
export function applyPortalTheme(pathname) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (isThemeNativePath(pathname)) root.removeAttribute("data-portal-invert");
  else root.setAttribute("data-portal-invert", "");
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

export function initTheme() {
  applyTheme(getStoredTheme());
}

// Current theme, kept in sync when it is changed from anywhere in the app
// (sidebar toggle, home header toggle) or from another tab.
export function useTheme() {
  const [theme, setThemeState] = useState("dark");

  useEffect(() => {
    setThemeState(getStoredTheme());
    const onChange = (e) => setThemeState(e.detail || getStoredTheme());
    const onStorage = (e) => {
      if (e.key === THEME_KEY) {
        const next = e.newValue || "dark";
        applyTheme(next);
        setThemeState(next);
      }
    };
    window.addEventListener(THEME_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return theme;
}
