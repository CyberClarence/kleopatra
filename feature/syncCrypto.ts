"use client";

/**
 * Client-side crypto for online sync. The account password NEVER leaves the
 * browser. From it we derive, via PBKDF2 then HKDF:
 *
 *   password ─PBKDF2(600k, SHA-256, salt)─> master bits
 *     ├─HKDF("kleopatra/enc")──> AES-256-GCM key   (encrypts the vault, local only)
 *     └─HKDF("kleopatra/auth")─> auth key           (sent to server instead of a password)
 *
 * The server stores only a hash of the auth key, so neither the password nor
 * the encryption key can be recovered server-side.
 */

const PBKDF2_ITERATIONS = 600_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

export type DerivedKeys = {
  encKey: CryptoKey;
  /** base64url auth key to present to the server */
  authKey: string;
};

export const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};

export const fromB64 = (b64: string) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export const generateSalt = () => toB64(crypto.getRandomValues(new Uint8Array(16)));

export async function deriveKeys(password: string, saltB64: string): Promise<DerivedKeys> {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const masterBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: fromB64(saltB64),
      iterations: PBKDF2_ITERATIONS,
    },
    passwordKey,
    256
  );

  const hkdfKey = await crypto.subtle.importKey("raw", masterBits, "HKDF", false, [
    "deriveKey",
    "deriveBits",
  ]);

  const encKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: enc.encode("kleopatra/enc"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    true, // extractable so the key can persist locally across sessions
    ["encrypt", "decrypt"]
  );

  const authBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: enc.encode("kleopatra/auth"),
    },
    hkdfKey,
    256
  );

  return { encKey, authKey: toB64(authBits) };
}

export async function encryptVault(
  encKey: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encKey,
    enc.encode(plaintext)
  );
  return { ciphertext: toB64(ciphertext), iv: toB64(iv) };
}

export async function decryptVault(
  encKey: CryptoKey,
  ciphertextB64: string,
  ivB64: string
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(ivB64) },
    encKey,
    fromB64(ciphertextB64)
  );
  return dec.decode(plaintext);
}

export const exportKey = async (key: CryptoKey) =>
  JSON.stringify(await crypto.subtle.exportKey("jwk", key));

export const importKey = async (jwk: string) =>
  crypto.subtle.importKey("jwk", JSON.parse(jwk), { name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
