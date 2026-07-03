import { NextRequest, NextResponse } from "next/server";
const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
export async function POST(req: NextRequest) {
  let body: unknown = {};
  try { body = await req.json(); } catch { /* */ }
  try {
    const res = await fetch(`${API_BASE}/api/outlook/subscribe`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), cache: "no-store",
    });
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  } catch { return NextResponse.json({ detail: "Service unavailable" }, { status: 502 }); }
}
