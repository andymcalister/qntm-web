import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const COOKIE = "qntm_session";
const MAXAGE = 7 * 24 * 3600;

export async function POST(req: NextRequest) {
  let body: { challenge?: string; code?: string } = {};
  try { body = await req.json(); } catch { /* */ }
  if (!body.challenge || !body.code) {
    return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 400 });
  }
  let status = 502;
  let data: { detail?: string; session?: string } = {};
  try {
    const r = await fetch(`${API_BASE}/api/auth/mfa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge: body.challenge, code: body.code }),
      cache: "no-store",
    });
    status = r.status;
    data = await r.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ ok: false, error: "Service unreachable — try again." }, { status: 502 });
  }
  if (status !== 200 || !data.session) {
    return NextResponse.json({ ok: false, error: data?.detail === "challenge_expired" ? "That took too long — sign in again." : "Invalid code." }, { status: status === 200 ? 401 : status });
  }
  const resp = NextResponse.json({ ok: true });
  resp.cookies.set(COOKIE, data.session, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: MAXAGE });
  return resp;
}
