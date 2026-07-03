import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const COOKIE = "qntm_session";
const MAXAGE = 7 * 24 * 3600;

function setSession(resp: NextResponse, token: string) {
  resp.cookies.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: MAXAGE });
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string } = {};
  try { body = await req.json(); } catch { /* */ }
  if (!body.email || !body.password) {
    return NextResponse.json({ ok: false, error: "Enter your email and password." }, { status: 400 });
  }
  let status = 502;
  let data: { detail?: string; mfa_required?: boolean; challenge?: string; session?: string } = {};
  try {
    const r = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });
    status = r.status;
    data = await r.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ ok: false, error: "Sign-in service is waking up — try again in a moment." }, { status: 502 });
  }
  if (status !== 200) {
    return NextResponse.json({ ok: false, error: data?.detail || "Invalid email or password." }, { status });
  }
  if (data.mfa_required) {
    return NextResponse.json({ ok: true, mfa_required: true, challenge: data.challenge });
  }
  const resp = NextResponse.json({ ok: true, mfa_required: false });
  if (data.session) setSession(resp, data.session);
  return resp;
}
