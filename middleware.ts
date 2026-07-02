import { NextRequest, NextResponse } from "next/server";

// Where to send users who aren't signed in — the Streamlit app's login.
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";
const COOKIE = "qntm_session";

// Decode a base64url JWT segment (no signature check — that's the API's job).
function b64url(seg: string): string {
  let s = seg.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

// Cheap client-side expiry gate: bounce obviously-expired/missing sessions
// without a round-trip. The token's signature was verified by the API when the
// cookie was set; anything user-specific re-verifies server-side anyway.
function isValid(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const claims = JSON.parse(b64url(parts[1]));
    return typeof claims.exp === "number" && claims.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!isValid(token)) {
    const url = new URL(LOGIN_URL);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Guard only the product routes. Marketing pages and the /auth/handoff bridge
// stay public (handoff is how you GET a session in the first place).
export const config = {
  matcher: ["/screener", "/screener/(.*)", "/watchlist", "/watchlist/(.*)", "/portfolio", "/portfolio/(.*)", "/model-portfolio", "/model-portfolio/(.*)", "/hidden-gems", "/hidden-gems/(.*)", "/simulator", "/simulator/(.*)", "/alerts", "/alerts/(.*)", "/account", "/account/(.*)"],
};
