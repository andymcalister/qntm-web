import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const COOKIE = "qntm_session";
const MAXAGE = 7 * 24 * 3600;

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; full_name?: string } = {};
  try { body = await req.json(); } catch { /* */ }
  if (!body.email || !body.password) {
    return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
  }
  let status = 502;
  let data: { detail?: string; session?: string } = {};
  try {
    const r = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password, full_name: body.full_name || "" }),
      cache: "no-store",
    });
    status = r.status;
    data = await r.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ ok: false, error: "Service is waking up — try again in a moment." }, { status: 502 });
  }
  if (status !== 200) {
    return NextResponse.json({ ok: false, error: data?.detail || "Registration failed." }, { status });
  }
  const resp = NextResponse.json({ ok: true });
  if (data.session) resp.cookies.set(COOKIE, data.session, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: MAXAGE });
  return resp;
}
