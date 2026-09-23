import { useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/router";
import { installAuthFetch } from "../lib/auth";
import { initTheme, applyPortalTheme } from "../lib/theme";
import "../styles/theme.css";
// Tailwind utilities for the standalone Session Operations Intelligence
// prototype (pages/operations, components/opsIntel). Preflight is disabled
// in tailwind.config.js so this only affects elements that opt in with
// Tailwind classNames — every other page is untouched.
import "../styles/opsIntel.css";

installAuthFetch();

// useLayoutEffect warns during SSR; on the server there is nothing to apply anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Runs before paint on every client-side navigation so the page never flashes
  // in the wrong theme treatment.
  useIsomorphicLayoutEffect(() => {
    applyPortalTheme(router.pathname);
  }, [router.pathname]);

  useEffect(() => {
    initTheme();
  }, []);

  return <Component {...pageProps} />;
}
// Pipeline verification: 2026-09-23T13:30:48Z — safe to delete
