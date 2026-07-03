import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const r = await fetch(`${API}/api/auth/verify-email`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    return NextResponse.json(d, { status: r.status });
  } catch {
    return NextResponse.json({ ok: false, detail: "Something went wrong." }, { status: 500 });
  }
}
