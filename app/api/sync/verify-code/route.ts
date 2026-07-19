import { NextResponse } from "next/server";
import {
  REG_TOKEN_TTL,
  codeKey,
  getAccount,
  isValidEmail,
  jsonError,
  newToken,
  normalizeEmail,
  regKey,
  safeEqual,
  sha256,
} from "@/lib/server/auth";
import { getJSON, kv, setJSON } from "@/lib/server/store";

export const runtime = "nodejs";

type PendingCode = { codeHash: string; attempts: number; createdAt: number };

export async function POST(req: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const email = normalizeEmail(body.email || "");
  const code = (body.code || "").trim();
  if (!isValidEmail(email)) return jsonError("Invalid email address", 400);
  if (!/^\d{6}$/.test(code)) return jsonError("Code must be 6 digits", 400);

  const pending = await getJSON<PendingCode>(codeKey(email));
  if (!pending) return jsonError("Code expired or not requested. Request a new one.", 400);

  if (pending.attempts >= 5) {
    await kv.del(codeKey(email));
    return jsonError("Too many wrong attempts. Request a new code.", 429);
  }

  if (!safeEqual(sha256(code), pending.codeHash)) {
    await setJSON(codeKey(email), { ...pending, attempts: pending.attempts + 1 }, 60 * 10);
    return jsonError("Wrong code", 400);
  }

  // Email ownership proven — issue a short-lived registration token that
  // authorizes setting (or resetting) the account password.
  await kv.del(codeKey(email));
  const regToken = newToken();
  await setJSON(regKey(email), { tokenHash: sha256(regToken) }, REG_TOKEN_TTL);

  return NextResponse.json({
    ok: true,
    regToken,
    accountExists: Boolean(await getAccount(email)),
  });
}
