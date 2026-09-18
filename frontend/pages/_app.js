import { useEffect } from "react";
import { installAuthFetch } from "../lib/auth";
import { initTheme } from "../lib/theme";
import "../styles/theme.css";

installAuthFetch();

export default function App({ Component, pageProps }) {
  useEffect(() => {
    initTheme();
  }, []);

  return <Component {...pageProps} />;
}
