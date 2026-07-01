import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const COOKIE = "qntm_session";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const t = req.cookies.get(COOKIE)?.value;
  if (!t) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { ticker } = await params;
  try {
    const res = await fetch(`${API_BASE}/api/watchlist/${encodeURIComponent(ticker)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
