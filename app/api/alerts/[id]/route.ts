import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const COOKIE = "qntm_session";
const tok = (req: NextRequest) => req.cookies.get(COOKIE)?.value || null;

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = tok(req);
  if (!t) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await fetch(`${API_BASE}/api/alerts/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` }, cache: "no-store" });
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  } catch { return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = tok(req);
  if (!t) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${API_BASE}/api/alerts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ active: !!body?.active }), cache: "no-store",
    });
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  } catch { return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 }); }
}
