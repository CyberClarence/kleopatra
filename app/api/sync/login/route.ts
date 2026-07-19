import { NextResponse } from "next/server";
import {
  createSession,
  getAccount,
  isValidEmail,
  jsonError,
  normalizeEmail,
  rateLimit,
  safeEqual,
  sha256,
} from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; authKey?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const email = normalizeEmail(body.email || "");
  const { authKey } = body;
  if (!isValidEmail(email) || !authKey) return jsonError("Invalid credentials", 400);

  if (!(await rateLimit("login", email, 10, 15 * 60))) {
    return jsonError("Too many login attempts. Try again in 15 minutes.", 429);
  }

  const account = await getAccount(email);
  if (!account || !safeEqual(sha256(authKey), account.authKeyHash)) {
    return jsonError("Wrong email or password", 401);
  }

  const token = await createSession(email);
  return NextResponse.json({ ok: true, token });
}
