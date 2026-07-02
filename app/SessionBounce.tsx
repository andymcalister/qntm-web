"use client";

import { useEffect } from "react";

// Cutover hand-off catcher. After a user logs in on the classic app, it mints a
// signed bridge JWT and redirects here to qntm.live/#bt=<jwt>. This component
// (mounted on the home page) reads that token from the URL fragment — fragments
// never hit the server or logs — exchanges it for an httpOnly session via
// /api/session, and drops the user on the screener. Renders nothing.
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";

export default function SessionBounce() {
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.indexOf("bt=") === -1) return;

    const m = hash.match(/bt=([^&]+)/);
    const token = m ? decodeURIComponent(m[1]) : null;

    // Strip the token from the URL immediately so it never lingers in history.
    try {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch {
      /* no-op */
    }
    if (!token) return;

    (async () => {
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        // Valid → into the app. Invalid/expired → back to classic login.
        window.location.replace(res.ok ? "/screener" : LOGIN_URL);
      } catch {
        window.location.replace(LOGIN_URL);
      }
    })();
  }, []);

  return null;
}
