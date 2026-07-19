import { NextResponse } from "next/server";
import {
  fakeSalt,
  getAccount,
  isValidEmail,
  jsonError,
  normalizeEmail,
  rateLimit,
} from "@/lib/server/auth";

export const runtime = "nodejs";

/**
 * Returns the PBKDF2 salt for an email so the client can derive its keys
 * before login. Unknown emails get a deterministic fake salt to avoid
 * account enumeration.
 */
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const email = normalizeEmail(body.email || "");
  if (!isValidEmail(email)) return jsonError("Invalid email address", 400);

  if (!(await rateLimit("salt", email, 20, 15 * 60))) {
    return jsonError("Too many requests", 429);
  }

  const account = await getAccount(email);
  return NextResponse.json({ salt: account ? account.salt : fakeSalt(email) });
}
