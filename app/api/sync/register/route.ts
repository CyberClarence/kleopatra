import { NextResponse } from "next/server";
import {
  Account,
  accountKey,
  createSession,
  isValidEmail,
  jsonError,
  normalizeEmail,
  regKey,
  safeEqual,
  sha256,
} from "@/lib/server/auth";
import { getJSON, kv, setJSON } from "@/lib/server/store";

export const runtime = "nodejs";

/**
 * Finalizes account creation (or a password reset — both require a fresh
 * email verification). The client sends the PBKDF2 salt it generated and the
 * derived auth key; the password itself never leaves the client.
 */
export async function POST(req: Request) {
  let body: { email?: string; regToken?: string; salt?: string; authKey?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const email = normalizeEmail(body.email || "");
  const { regToken, salt, authKey } = body;
  if (!isValidEmail(email)) return jsonError("Invalid email address", 400);
  if (!regToken || !salt || !authKey) return jsonError("Missing fields", 400);
  if (salt.length > 64 || authKey.length > 128) return jsonError("Invalid fields", 400);

  const pending = await getJSON<{ tokenHash: string }>(regKey(email));
  if (!pending || !safeEqual(sha256(regToken), pending.tokenHash)) {
    return jsonError("Registration token invalid or expired. Verify your email again.", 401);
  }
  await kv.del(regKey(email));

  const account: Account = {
    email,
    salt,
    authKeyHash: sha256(authKey),
    createdAt: Date.now(),
  };
  await setJSON(accountKey(email), account);

  const token = await createSession(email);
  return NextResponse.json({ ok: true, token });
}
