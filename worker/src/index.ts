/**
 * Kleopatra secure sync API — Cloudflare Worker (api.kleopatra.app)
 *
 * Holds all server-side logic for online sync: email verification codes,
 * account registration/login with password-derived auth keys, and encrypted
 * vault storage. The vault is AES-256-GCM ciphertext produced client-side —
 * this API never sees passwords, encryption keys, or plaintext keys.
 *
 * Storage: D1 (see schema.sql). Email: Postmark from mail.kleopatra.app.
 * Also serves the desktop app downloads from the RELEASES R2 bucket.
 */

export interface Env {
  DB: D1Database;
  RELEASES: R2Bucket;
  POSTMARK_API_TOKEN: string;
  POSTMARK_FROM_EMAIL: string;
  SYNC_SERVER_SECRET: string;
  DOWNLOAD_MAC_KEY: string;
  DOWNLOAD_WIN_KEY: string;
}

const CODE_TTL_MS = 10 * 60 * 1000;
const REG_TOKEN_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_VAULT_BYTES = 2 * 1024 * 1024;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/* ── helpers ─────────────────────────────────────────────────────── */

const enc = new TextEncoder();

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

const jsonError = (message: string, status: number) => json({ error: message }, status);

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const newToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

function newCode(): string {
  // Rejection sampling for an unbiased 6-digit code.
  const max = 4_294_967_296 - (4_294_967_296 % 1_000_000);
  let n: number;
  do {
    n = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (n >= max);
  return String(n % 1_000_000).padStart(6, "0");
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

/** Deterministic decoy salt so /salt does not reveal whether an account exists. */
async function fakeSalt(env: Env, email: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(env.SYNC_SERVER_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(email));
  return btoa(String.fromCharCode(...new Uint8Array(mac))).slice(0, 24);
}

async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/** Fixed-window rate limit backed by D1. Returns true when allowed. */
async function rateLimit(env: Env, bucket: string, max: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const row = await env.DB.prepare("SELECT count, reset_at FROM rate_limits WHERE bucket = ?")
    .bind(bucket)
    .first<{ count: number; reset_at: number }>();
  if (!row || now > row.reset_at) {
    await env.DB.prepare(
      `INSERT INTO rate_limits (bucket, count, reset_at) VALUES (?, 1, ?)
       ON CONFLICT (bucket) DO UPDATE SET count = 1, reset_at = excluded.reset_at`
    )
      .bind(bucket, now + windowMs)
      .run();
    return true;
  }
  if (row.count >= max) return false;
  await env.DB.prepare("UPDATE rate_limits SET count = count + 1 WHERE bucket = ?").bind(bucket).run();
  return true;
}

async function sessionEmail(env: Env, req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const row = await env.DB.prepare(
    "SELECT email, expires_at FROM sessions WHERE token_hash = ?"
  )
    .bind(await sha256Hex(token))
    .first<{ email: string; expires_at: number }>();
  if (!row || Date.now() > row.expires_at) return null;
  return row.email;
}

async function sendVerificationEmail(env: Env, to: string, code: string): Promise<void> {
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": env.POSTMARK_API_TOKEN,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      From: `Kleopatra <${env.POSTMARK_FROM_EMAIL}>`,
      To: to,
      Subject: `${code} is your Kleopatra verification code`,
      TextBody: `Your Kleopatra verification code is: ${code}\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.`,
      HtmlBody: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0e7490">Kleopatra</h2>
        <p>Your verification code is:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p>
        <p style="color:#666">It expires in 10 minutes. If you did not request this, you can ignore this email.</p>
      </div>`,
      MessageStream: "outbound",
    }),
  });
  if (!res.ok) {
    throw new Error(`Postmark ${res.status}: ${await res.text()}`);
  }
}

/* ── sync API handlers ───────────────────────────────────────────── */

async function handleRequestCode(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ email?: string }>(req);
  const email = normalizeEmail(body?.email || "");
  if (!isValidEmail(email)) return jsonError("Invalid email address", 400);

  if (!(await rateLimit(env, `code:${email}`, 3, 15 * 60 * 1000))) {
    return jsonError("Too many codes requested. Try again in 15 minutes.", 429);
  }

  const code = newCode();
  await env.DB.prepare(
    `INSERT INTO codes (email, code_hash, attempts, expires_at) VALUES (?, ?, 0, ?)
     ON CONFLICT (email) DO UPDATE SET code_hash = excluded.code_hash, attempts = 0, expires_at = excluded.expires_at`
  )
    .bind(email, await sha256Hex(code), Date.now() + CODE_TTL_MS)
    .run();

  await sendVerificationEmail(env, email, code);

  const account = await env.DB.prepare("SELECT 1 FROM accounts WHERE email = ?").bind(email).first();
  return json({ ok: true, accountExists: Boolean(account) });
}

async function handleVerifyCode(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ email?: string; code?: string }>(req);
  const email = normalizeEmail(body?.email || "");
  const code = (body?.code || "").trim();
  if (!isValidEmail(email)) return jsonError("Invalid email address", 400);
  if (!/^\d{6}$/.test(code)) return jsonError("Code must be 6 digits", 400);

  const pending = await env.DB.prepare(
    "SELECT code_hash, attempts, expires_at FROM codes WHERE email = ?"
  )
    .bind(email)
    .first<{ code_hash: string; attempts: number; expires_at: number }>();

  if (!pending || Date.now() > pending.expires_at) {
    return jsonError("Code expired or not requested. Request a new one.", 400);
  }
  if (pending.attempts >= 5) {
    await env.DB.prepare("DELETE FROM codes WHERE email = ?").bind(email).run();
    return jsonError("Too many wrong attempts. Request a new code.", 429);
  }
  if ((await sha256Hex(code)) !== pending.code_hash) {
    await env.DB.prepare("UPDATE codes SET attempts = attempts + 1 WHERE email = ?").bind(email).run();
    return jsonError("Wrong code", 400);
  }

  // Email ownership proven — issue a short-lived registration token.
  await env.DB.prepare("DELETE FROM codes WHERE email = ?").bind(email).run();
  const regToken = newToken();
  await env.DB.prepare(
    `INSERT INTO reg_tokens (email, token_hash, expires_at) VALUES (?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET token_hash = excluded.token_hash, expires_at = excluded.expires_at`
  )
    .bind(email, await sha256Hex(regToken), Date.now() + REG_TOKEN_TTL_MS)
    .run();

  const account = await env.DB.prepare("SELECT 1 FROM accounts WHERE email = ?").bind(email).first();
  return json({ ok: true, regToken, accountExists: Boolean(account) });
}

async function handleRegister(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ email?: string; regToken?: string; salt?: string; authKey?: string }>(req);
  const email = normalizeEmail(body?.email || "");
  const { regToken, salt, authKey } = body || {};
  if (!isValidEmail(email)) return jsonError("Invalid email address", 400);
  if (!regToken || !salt || !authKey) return jsonError("Missing fields", 400);
  if (salt.length > 64 || authKey.length > 128) return jsonError("Invalid fields", 400);

  const pending = await env.DB.prepare(
    "SELECT token_hash, expires_at FROM reg_tokens WHERE email = ?"
  )
    .bind(email)
    .first<{ token_hash: string; expires_at: number }>();
  if (!pending || Date.now() > pending.expires_at || (await sha256Hex(regToken)) !== pending.token_hash) {
    return jsonError("Registration token invalid or expired. Verify your email again.", 401);
  }
  await env.DB.prepare("DELETE FROM reg_tokens WHERE email = ?").bind(email).run();

  await env.DB.prepare(
    `INSERT INTO accounts (email, salt, auth_key_hash, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET salt = excluded.salt, auth_key_hash = excluded.auth_key_hash`
  )
    .bind(email, salt, await sha256Hex(authKey), Date.now())
    .run();

  // Password changed — revoke every other device's session.
  await env.DB.prepare("DELETE FROM sessions WHERE email = ?").bind(email).run();

  const token = newToken();
  await env.DB.prepare("INSERT INTO sessions (token_hash, email, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256Hex(token), email, Date.now() + SESSION_TTL_MS)
    .run();
  return json({ ok: true, token });
}

async function handleSalt(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ email?: string }>(req);
  const email = normalizeEmail(body?.email || "");
  if (!isValidEmail(email)) return jsonError("Invalid email address", 400);
  if (!(await rateLimit(env, `salt:${email}`, 20, 15 * 60 * 1000))) {
    return jsonError("Too many requests", 429);
  }
  const account = await env.DB.prepare("SELECT salt FROM accounts WHERE email = ?")
    .bind(email)
    .first<{ salt: string }>();
  return json({ salt: account ? account.salt : await fakeSalt(env, email) });
}

async function handleLogin(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ email?: string; authKey?: string }>(req);
  const email = normalizeEmail(body?.email || "");
  const authKey = body?.authKey;
  if (!isValidEmail(email) || !authKey) return jsonError("Invalid credentials", 400);
  if (!(await rateLimit(env, `login:${email}`, 10, 15 * 60 * 1000))) {
    return jsonError("Too many login attempts. Try again in 15 minutes.", 429);
  }

  const account = await env.DB.prepare("SELECT auth_key_hash FROM accounts WHERE email = ?")
    .bind(email)
    .first<{ auth_key_hash: string }>();
  if (!account || (await sha256Hex(authKey)) !== account.auth_key_hash) {
    return jsonError("Wrong email or password", 401);
  }

  const token = newToken();
  await env.DB.prepare("INSERT INTO sessions (token_hash, email, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256Hex(token), email, Date.now() + SESSION_TTL_MS)
    .run();
  return json({ ok: true, token });
}

async function handleLogout(req: Request, env: Env): Promise<Response> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await sha256Hex(token))
      .run();
  }
  return json({ ok: true });
}

async function handleVaultGet(req: Request, env: Env): Promise<Response> {
  const email = await sessionEmail(env, req);
  if (!email) return jsonError("Not authenticated", 401);
  const vault = await env.DB.prepare(
    "SELECT ciphertext, iv, version, updated_at FROM vaults WHERE email = ?"
  )
    .bind(email)
    .first<{ ciphertext: string; iv: string; version: number; updated_at: number }>();
  return json({
    vault: vault
      ? { ciphertext: vault.ciphertext, iv: vault.iv, version: vault.version, updatedAt: vault.updated_at }
      : null,
  });
}

async function handleVaultPut(req: Request, env: Env): Promise<Response> {
  const email = await sessionEmail(env, req);
  if (!email) return jsonError("Not authenticated", 401);

  const body = await readJson<{ ciphertext?: string; iv?: string; version?: number }>(req);
  const { ciphertext, iv, version } = body || {};
  if (typeof ciphertext !== "string" || typeof iv !== "string" || typeof version !== "number") {
    return jsonError("Missing fields", 400);
  }
  if (ciphertext.length > MAX_VAULT_BYTES) return jsonError("Vault too large", 413);

  const existing = await env.DB.prepare(
    "SELECT ciphertext, iv, version, updated_at FROM vaults WHERE email = ?"
  )
    .bind(email)
    .first<{ ciphertext: string; iv: string; version: number; updated_at: number }>();

  if (existing && version <= existing.version) {
    return json(
      {
        error: "Version conflict",
        vault: {
          ciphertext: existing.ciphertext,
          iv: existing.iv,
          version: existing.version,
          updatedAt: existing.updated_at,
        },
      },
      409
    );
  }

  const updatedAt = Date.now();
  await env.DB.prepare(
    `INSERT INTO vaults (email, ciphertext, iv, version, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET ciphertext = excluded.ciphertext, iv = excluded.iv,
       version = excluded.version, updated_at = excluded.updated_at`
  )
    .bind(email, ciphertext, iv, version, updatedAt)
    .run();
  return json({ ok: true, vault: { ciphertext, iv, version, updatedAt } });
}

/* ── desktop downloads (R2) ──────────────────────────────────────── */

async function handleDownload(env: Env, platform: string): Promise<Response> {
  const key = platform === "mac" ? env.DOWNLOAD_MAC_KEY : platform === "windows" ? env.DOWNLOAD_WIN_KEY : null;
  if (!key) return jsonError("Unknown platform", 404);

  const object = await env.RELEASES.get(key);
  if (!object) {
    return jsonError(
      platform === "windows"
        ? "The Windows build is not available yet — check back soon."
        : "Download not available",
      404
    );
  }
  return new Response(object.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(object.size),
      "Content-Disposition": `attachment; filename="${key}"`,
      "Cache-Control": "public, max-age=3600",
      ...CORS_HEADERS,
    },
  });
}

/* ── router ──────────────────────────────────────────────────────── */

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const { pathname } = url;

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      if (pathname.startsWith("/api/sync/")) {
        const route = pathname.slice("/api/sync/".length).replace(/\/$/, "");
        if (req.method === "POST") {
          switch (route) {
            case "request-code":
              return await handleRequestCode(req, env);
            case "verify-code":
              return await handleVerifyCode(req, env);
            case "register":
              return await handleRegister(req, env);
            case "salt":
              return await handleSalt(req, env);
            case "login":
              return await handleLogin(req, env);
            case "logout":
              return await handleLogout(req, env);
          }
        }
        if (route === "vault") {
          if (req.method === "GET") return await handleVaultGet(req, env);
          if (req.method === "PUT") return await handleVaultPut(req, env);
        }
        return jsonError("Not found", 404);
      }

      if (pathname.startsWith("/download/")) {
        return await handleDownload(env, pathname.slice("/download/".length).replace(/\/$/, ""));
      }

      if (pathname === "/" || pathname === "/health") {
        return json({ service: "kleopatra-api", status: "ok" });
      }
      return jsonError("Not found", 404);
    } catch (e) {
      console.error("[kleopatra-api]", e instanceof Error ? e.stack : e);
      return jsonError("Internal error", 500);
    }
  },
} satisfies ExportedHandler<Env>;
