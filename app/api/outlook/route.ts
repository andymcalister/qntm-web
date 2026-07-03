import { NextRequest, NextResponse } from "next/server";
const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const limit = searchParams.get("limit") || "20";
  const qs = new URLSearchParams({ limit }); if (kind) qs.set("kind", kind);
  try {
    const res = await fetch(`${API_BASE}/api/outlook?${qs}`, { cache: "no-store" });
    return NextResponse.json(await res.json().catch(() => ({ items: [] })), { status: res.status });
  } catch { return NextResponse.json({ items: [] }, { status: 502 }); }
}
