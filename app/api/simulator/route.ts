import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const COOKIE = "qntm_session";

function token(req: NextRequest): string | null {
  return req.cookies.get(COOKIE)?.value || null;
}

// Forwards the caller's token so the API can gate by live plan; passes the
// selected risk profile through.
export async function GET(req: NextRequest) {
  const t = token(req);
  if (!t) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const profile = (req.nextUrl.searchParams.get("profile") || "MEDIUM").toUpperCase();
  try {
    const res = await fetch(`${API_BASE}/api/simulator?profile=${encodeURIComponent(profile)}`, {
      headers: { Authorization: `Bearer ${t}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
