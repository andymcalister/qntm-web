import { NextRequest, NextResponse } from "next/server";

const COOKIE = "qntm_session";
// Admin allowlist for the client-side Admin nav link (mirror of the API gate).
// The API still enforces admin on /api/admin/* regardless of this.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@qntm.live")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

// Decode a JWT payload segment (no signature check — used only to surface the
// plan for the free-tier gate; the cookie was already verified by the API when
// it was set, and nothing security-sensitive hangs off this).
function decodePayload(token: string): any {
  const seg = token.split(".")[1];
  let s = seg.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return JSON.parse(Buffer.from(s, "base64").toString("utf8"));
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ authenticated: false, plan: "free" });
  try {
    const c = decodePayload(token);
    return NextResponse.json({
      authenticated: true,
      user_id: c.sub ?? null,
      email: c.email ?? null,
      plan: c.plan ?? "free",
      is_admin: !!(c.email && ADMIN_EMAILS.includes(String(c.email).toLowerCase())),
    });
  } catch {
    return NextResponse.json({ authenticated: false, plan: "free" });
  }
}
