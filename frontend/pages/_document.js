import { Html, Head, Main, NextScript } from "next/document";

// Applies the saved theme to <html> before first paint, so switching to light mode
// doesn't flash dark (or vice versa) while the page is loading.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem("omTheme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

// Applies the saved sidebar collapse state before first paint, so a returning
// user who collapsed the sidebar doesn't see the page content flash at the
// full 280px margin before Sidebar.js's own effect corrects it.
const SIDEBAR_INIT_SCRIPT = `
(function() {
  try {
    var collapsed = localStorage.getItem("omSidebarCollapsed") === "1";
    document.documentElement.style.setProperty("--om-sidebar-width", collapsed ? "84px" : "280px");
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_INIT_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
