import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getJSON, kv, setJSON } from "./store";

/**
 * Server-side account model. The client NEVER sends its password: it derives
 * two independent keys from it (PBKDF2 → HKDF):
 *   - an AES-256-GCM encryption key that never leaves the client
 *   - an "auth key" sent to the server in place of a password
 * We store only a SHA-256 hash of the auth key (it is already a random-looking
 * 256-bit value, so a fast hash is fine — there is nothing to brute-force).
 */

export type Account = {
  email: string;
  /** base64 PBKDF2 salt, generated client-side, served back before login */
  salt: string;
  /** sha256(authKey) hex */
  authKeyHash: string;
  createdAt: number;
};

export type Vault = {
  /** base64 AES-256-GCM ciphertext of the keystore JSON */
  ciphertext: string;
  /** base64 12-byte IV */
  iv: string;
  version: number;
  updatedAt: number;
};

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
export const CODE_TTL = 60 * 10; // 10 minutes
export const REG_TOKEN_TTL = 60 * 15;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

export const sha256 = (data: string) =>
  createHash("sha256").update(data).digest("hex");

export const safeEqual = (a: string, b: string) => {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
};

export const newToken = () => randomBytes(32).toString("base64url");

export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/**
 * Deterministic fake salt for unknown emails so the /salt endpoint does not
 * reveal whether an account exists.
 */
export const fakeSalt = (email: string) => {
  const secret = process.env.SYNC_SERVER_SECRET || "kleopatra-dev-secret";
  return createHmac("sha256", secret).update(email).digest("base64").slice(0, 24);
};

export const accountKey = (email: string) => `acct:${email}`;
export const codeKey = (email: string) => `code:${email}`;
export const regKey = (email: string) => `reg:${email}`;
export const sessionKey = (token: string) => `sess:${token}`;
export const vaultKey = (email: string) => `vault:${email}`;
export const rateKey = (bucket: string, id: string) => `rate:${bucket}:${id}`;

export const getAccount = (email: string) => getJSON<Account>(accountKey(email));

export async function createSession(email: string): Promise<string> {
  const token = newToken();
  await setJSON(sessionKey(token), { email, createdAt: Date.now() }, SESSION_TTL);
  return token;
}

/** Resolves the Bearer token of a request to an account email, or null. */
export async function authenticate(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const session = await getJSON<{ email: string }>(sessionKey(token));
  return session?.email ?? null;
}

export async function revokeSession(req: Request): Promise<void> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) await kv.del(sessionKey(token));
}

/** Fixed-window rate limit. Returns true when the call is allowed. */
export async function rateLimit(
  bucket: string,
  id: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const key = rateKey(bucket, id);
  const current = await getJSON<{ count: number; resetAt: number }>(key);
  if (!current || Date.now() > current.resetAt) {
    await setJSON(key, { count: 1, resetAt: Date.now() + windowSeconds * 1000 }, windowSeconds);
    return true;
  }
  if (current.count >= max) return false;
  await setJSON(
    key,
    { ...current, count: current.count + 1 },
    Math.max(1, Math.ceil((current.resetAt - Date.now()) / 1000))
  );
  return true;
}

export const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });
