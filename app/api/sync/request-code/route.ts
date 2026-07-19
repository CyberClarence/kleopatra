import { NextResponse } from "next/server";
import { sendVerificationCode } from "@/lib/server/email";
import {
  CODE_TTL,
  codeKey,
  getAccount,
  isValidEmail,
  jsonError,
  newCode,
  normalizeEmail,
  rateLimit,
  sha256,
} from "@/lib/server/auth";
import { setJSON } from "@/lib/server/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const email = normalizeEmail(body.email || "");
  if (!isValidEmail(email)) return jsonError("Invalid email address", 400);

  if (!(await rateLimit("code", email, 3, 15 * 60))) {
    return jsonError("Too many codes requested. Try again in 15 minutes.", 429);
  }

  const code = newCode();
  await setJSON(
    codeKey(email),
    { codeHash: sha256(code), attempts: 0, createdAt: Date.now() },
    CODE_TTL
  );

  const { delivered } = await sendVerificationCode(email, code);
  const accountExists = Boolean(await getAccount(email));

  return NextResponse.json({
    ok: true,
    accountExists,
    // Dev convenience only: surfaced when no email provider is configured.
    ...(delivered || process.env.NODE_ENV === "production"
      ? {}
      : { devCode: code }),
  });
}
