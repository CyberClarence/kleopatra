import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS for the sync API. The Electron desktop app serves its UI from a local
 * origin (http://127.0.0.1:<random port>) but signs in and syncs against the
 * hosted server, so cross-origin requests must be allowed. Auth is a Bearer
 * token (no cookies), which makes a wildcard origin safe here.
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: "/api/sync/:path*",
};
