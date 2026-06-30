import { NextRequest, NextResponse } from "next/server";

// The FastAPI service that verifies tokens. Server-side env (no NEXT_PUBLIC_
// needed here since this runs on the server), with a sensible default.
const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const COOKIE = "qntm_session";

// POST /api/session  — body { token }
// Verifies the bridge token with the API. On success, stashes it in an httpOnly
// cookie (the session) and the browser is sent on to /screener. The token never
// touches client JS storage; it lives only in the httpOnly cookie.
export async function POST(req: NextRequest) {
  let token: string | null = null;
  try {
    ({ token } = await req.json());
  } catch {
    /* malformed body */
  }
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  let claims: { exp?: number } = {};
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
    }
    claims = await res.json();
  } catch {
    return NextResponse.json({ ok: false, error: "verify_unreachable" }, { status: 502 });
  }

  // Cookie lifetime tracks the token's own expiry.
  const now = Math.floor(Date.now() / 1000);
  const maxAge = claims.exp ? Math.max(0, claims.exp - now) : 60 * 60;

  const resp = NextResponse.json({ ok: true });
  resp.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return resp;
}

// DELETE /api/session — sign out (clear the cookie).
export async function DELETE() {
  const resp = NextResponse.json({ ok: true });
  resp.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return resp;
}
