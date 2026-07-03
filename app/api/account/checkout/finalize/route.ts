import { NextRequest, NextResponse } from "next/server";
const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const COOKIE = "qntm_session";
const tok = (req: NextRequest) => req.cookies.get(COOKIE)?.value || null;
export async function POST(req: NextRequest) {
  const t = tok(req);
  if (!t) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  try {
    const res = await fetch(`${API_BASE}/api/account/checkout/finalize`, {
      method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: "{}", cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch { return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 }); }
}
