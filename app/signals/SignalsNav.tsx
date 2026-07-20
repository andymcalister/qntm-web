"use client";
//
import { useEffect, useState } from "react";
import NavBar from "../screener/NavBar";
//
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";
//
export default function SignalsNav() {
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState("free");
  //
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/me", { cache: "no-store" }).then((r) => r.json());
        setUid(me?.user_id || "");
        setPlan(me?.plan || "free");
      } catch { /* nav still renders */ }
    })();
  }, []);
  //
  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }
  //
  return <NavBar uid={uid} plan={plan} active="signals" onSignOut={signOut} />;
}
