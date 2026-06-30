"use client";

// app/SessionBounce.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Runs ONLY in the browser, on the marketing apex (qntm.live), after cutover.
// Two jobs, both transitional and self-sunsetting:
//
//  1) Logged-in member hits the bare apex → read the `qntm_auth` token that the
//     Streamlit app wrote to qntm.live-origin localStorage (it persists across the
//     Render→Vercel handoff because localStorage is keyed by origin, not server).
//     Forward to app.qntm.live/?uid=<token>, where the app's existing ?uid= restore
//     logs them straight in. Tokens expire ~30 days and new logins now write to the
//     app.qntm.live origin, so this naturally stops mattering as members migrate.
//
//  2) Stray email link → an old reset/verify/legal email pointing at
//     qntm.live/?reset_token=… (sent before cutover) hits the new apex. Forward
//     those params intact to app.qntm.live so the link still works.
//
// Safety:
//  - sessionStorage one-shot guard → cannot loop, even if the app ever bounced back.
//  - Renders nothing. Crawlers + logged-out visitors (no token, no param) never
//    redirect, so the marketing page is what they (and Google) see.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";

const APP_ORIGIN = "https://app.qntm.live";
const TOKEN_KEY = "qntm_auth";
const GUARD_KEY = "qntm_bounced"; // one-shot, per browser tab/session

// Params that belong to the APP, not the marketing site — forward them through.
const FORWARD_PARAMS = ["reset_token", "verify_token", "uid", "plan", "legal", "qnav"];

export default function SessionBounce() {
  useEffect(() => {
    try {
      // Never bounce more than once per session — hard stop against any loop.
      if (sessionStorage.getItem(GUARD_KEY)) return;

      const url = new URL(window.location.href);
      const params = url.searchParams;

      // ── Case 2: stray app params in the URL (old email links) ──────────────
      const hasForwardParam = FORWARD_PARAMS.some((p) => params.has(p));
      if (hasForwardParam) {
        sessionStorage.setItem(GUARD_KEY, "1");
        const dest = new URL(APP_ORIGIN + "/");
        FORWARD_PARAMS.forEach((p) => {
          const v = params.get(p);
          if (v !== null) dest.searchParams.set(p, v);
        });
        window.location.replace(dest.toString());
        return;
      }

      // ── Case 1: logged-in member (token in apex-origin localStorage) ───────
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        sessionStorage.setItem(GUARD_KEY, "1");
        const dest = new URL(APP_ORIGIN + "/");
        dest.searchParams.set("uid", token);
        dest.searchParams.set("plan", "restore");
        window.location.replace(dest.toString());
        return;
      }
      // No token, no app params → do nothing. Marketing page renders normally.
    } catch {
      // Any failure (storage blocked, etc.) → stay on the marketing page.
    }
  }, []);

  return null;
}
