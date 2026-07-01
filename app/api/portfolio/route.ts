import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const COOKIE = "qntm_session";

function token(req: NextRequest): string | null {
  return req.cookies.get(COOKIE)?.value || null;
}

export async function GET(req: NextRequest) {
  const t = token(req);
  if (!t) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  try {
    const res = await fetch(`${API_BASE}/api/portfolio`, {
      headers: { Authorization: `Bearer ${t}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const t = token(req);
  if (!t) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${API_BASE}/api/portfolio`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: body?.ticker, shares: body?.shares, avg_cost: body?.avg_cost }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });   // forwards 402 for the free-plan cap
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
