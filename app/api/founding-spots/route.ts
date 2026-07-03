import { NextResponse } from "next/server";
const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/founding-spots`, { cache: "no-store" });
    const data = await res.json().catch(() => ({ remaining: 50, limit: 50 }));
    return NextResponse.json(data, { status: res.status });
  } catch { return NextResponse.json({ remaining: 50, limit: 50 }, { status: 502 }); }
}
