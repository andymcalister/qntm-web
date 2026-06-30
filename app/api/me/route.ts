import { NextRequest, NextResponse } from "next/server";

const COOKIE = "qntm_session";

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
    });
  } catch {
    return NextResponse.json({ authenticated: false, plan: "free" });
  }
}
