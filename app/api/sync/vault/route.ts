import { NextResponse } from "next/server";
import { Vault, authenticate, jsonError, vaultKey } from "@/lib/server/auth";
import { getJSON, setJSON } from "@/lib/server/store";

export const runtime = "nodejs";

// Armored PGP keys are a few KB each; 2 MB of ciphertext is plenty.
const MAX_VAULT_BYTES = 2 * 1024 * 1024;

export async function GET(req: Request) {
  const email = await authenticate(req);
  if (!email) return jsonError("Not authenticated", 401);

  const vault = await getJSON<Vault>(vaultKey(email));
  return NextResponse.json({ vault: vault ?? null });
}

export async function PUT(req: Request) {
  const email = await authenticate(req);
  if (!email) return jsonError("Not authenticated", 401);

  let body: { ciphertext?: string; iv?: string; version?: number };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { ciphertext, iv, version } = body;
  if (typeof ciphertext !== "string" || typeof iv !== "string" || typeof version !== "number") {
    return jsonError("Missing fields", 400);
  }
  if (ciphertext.length > MAX_VAULT_BYTES) return jsonError("Vault too large", 413);

  const existing = await getJSON<Vault>(vaultKey(email));
  if (existing && version <= existing.version) {
    // Stale writer (another device pushed since this client last pulled).
    return NextResponse.json(
      { error: "Version conflict", vault: existing },
      { status: 409 }
    );
  }

  const vault: Vault = { ciphertext, iv, version, updatedAt: Date.now() };
  await setJSON(vaultKey(email), vault);
  return NextResponse.json({ ok: true, vault });
}
