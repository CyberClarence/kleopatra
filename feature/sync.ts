"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useKeyStore } from "./keystore";
import {
  decryptVault,
  deriveKeys,
  encryptVault,
  exportKey,
  generateSalt,
  importKey,
} from "./syncCrypto";

/**
 * Online synchronisation. The vault (all private + public keys) is encrypted
 * with AES-256-GCM in the browser before upload — the server only ever sees
 * ciphertext. See feature/syncCrypto.ts for the key derivation scheme.
 *
 * Point NEXT_PUBLIC_SYNC_API_URL at a remote deployment (used by the Electron
 * build so the desktop app talks to the hosted sync server); the web app uses
 * same-origin relative URLs.
 */
const API_BASE = process.env.NEXT_PUBLIC_SYNC_API_URL || "";

export type SyncStatus = "signedOut" | "syncing" | "synced" | "error";

type SyncData = {
  email: string | null;
  token: string | null;
  salt: string | null;
  /** AES-256-GCM key as JWK JSON — lets sync resume without re-entering the password */
  encKeyJwk: string | null;
  vaultVersion: number;
  lastSyncedAt: number | null;
  status: SyncStatus;
  error: string | null;
};

type SyncActions = {
  requestCode: (email: string) => Promise<{ accountExists: boolean; devCode?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ regToken: string; accountExists: boolean }>;
  register: (email: string, regToken: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
  schedulePush: () => void;
};

type SyncStore = SyncData & SyncActions;

let cachedEncKey: CryptoKey | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api/sync/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`) as Error & {
      status: number;
      data: any;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

const keystoreSnapshot = () => {
  const { myPrivateKeys, myPublicKeys } = useKeyStore.getState();
  return { myPrivateKeys, myPublicKeys };
};

type Snapshot = ReturnType<typeof keystoreSnapshot>;

/** Union by key id — local entries win on conflict. */
function mergeSnapshots(local: Snapshot, remote: Snapshot): Snapshot {
  const mergeList = <T extends { id: string }>(a: T[], b: T[]) => {
    const seen = new Set(a.map((k) => k.id));
    return [...a, ...b.filter((k) => !seen.has(k.id))];
  };
  return {
    myPrivateKeys: mergeList(local.myPrivateKeys, remote.myPrivateKeys ?? []),
    myPublicKeys: mergeList(local.myPublicKeys, remote.myPublicKeys ?? []),
  };
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      email: null,
      token: null,
      salt: null,
      encKeyJwk: null,
      vaultVersion: 0,
      lastSyncedAt: null,
      status: "signedOut",
      error: null,

      requestCode: async (email) => {
        return api<{ accountExists: boolean; devCode?: string }>("request-code", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
      },

      verifyCode: async (email, code) => {
        return api<{ regToken: string; accountExists: boolean }>("verify-code", {
          method: "POST",
          body: JSON.stringify({ email, code }),
        });
      },

      register: async (email, regToken, password) => {
        const salt = generateSalt();
        const { encKey, authKey } = await deriveKeys(password, salt);
        const { token } = await api<{ token: string }>("register", {
          method: "POST",
          body: JSON.stringify({ email, regToken, salt, authKey }),
        });
        cachedEncKey = encKey;
        set({
          email,
          token,
          salt,
          encKeyJwk: await exportKey(encKey),
          vaultVersion: 0,
          status: "syncing",
          error: null,
        });
        await get().syncNow();
      },

      login: async (email, password) => {
        const { salt } = await api<{ salt: string }>("salt", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        const { encKey, authKey } = await deriveKeys(password, salt);
        const { token } = await api<{ token: string }>("login", {
          method: "POST",
          body: JSON.stringify({ email, authKey }),
        });
        cachedEncKey = encKey;
        set({
          email,
          token,
          salt,
          encKeyJwk: await exportKey(encKey),
          vaultVersion: 0,
          status: "syncing",
          error: null,
        });
        await get().syncNow();
      },

      logout: async () => {
        const { token } = get();
        if (token) {
          api("logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        cachedEncKey = null;
        if (pushTimer) clearTimeout(pushTimer);
        set({
          email: null,
          token: null,
          salt: null,
          encKeyJwk: null,
          vaultVersion: 0,
          lastSyncedAt: null,
          status: "signedOut",
          error: null,
        });
      },

      syncNow: async () => {
        const { token, encKeyJwk } = get();
        if (!token || !encKeyJwk || syncing) return;
        syncing = true;
        set({ status: "syncing", error: null });
        try {
          if (!cachedEncKey) cachedEncKey = await importKey(encKeyJwk);

          const { vault } = await api<{
            vault: { ciphertext: string; iv: string; version: number } | null;
          }>("vault", { headers: { Authorization: `Bearer ${token}` } });

          const local = keystoreSnapshot();
          let merged = local;
          let remoteVersion = 0;
          let remoteJson: string | null = null;

          if (vault) {
            remoteVersion = vault.version;
            try {
              remoteJson = await decryptVault(cachedEncKey, vault.ciphertext, vault.iv);
              merged = mergeSnapshots(local, JSON.parse(remoteJson));
            } catch {
              // Undecryptable remote vault: encrypted under a previous
              // password (account reset). Local data replaces it below.
            }
          }

          const mergedJson = JSON.stringify(merged);
          // Only touch the keystore when the merge changed something —
          // setState would re-trigger the push subscription otherwise.
          if (mergedJson !== JSON.stringify(local)) {
            useKeyStore.setState(merged);
          }
          const isEmpty =
            merged.myPrivateKeys.length === 0 && merged.myPublicKeys.length === 0;
          if (mergedJson !== remoteJson && !(isEmpty && !vault)) {
            const { ciphertext, iv } = await encryptVault(cachedEncKey, mergedJson);
            const { vault: savedVault } = await api<{ vault: { version: number } }>("vault", {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
              body: JSON.stringify({ ciphertext, iv, version: remoteVersion + 1 }),
            });
            remoteVersion = savedVault.version;
          }

          set({ status: "synced", vaultVersion: remoteVersion, lastSyncedAt: Date.now() });
        } catch (e: any) {
          if (e?.status === 401) {
            cachedEncKey = null;
            set({
              token: null,
              status: "signedOut",
              error: "Session expired — please sign in again.",
            });
          } else if (e?.status === 409) {
            // Another device pushed since our GET — retry with a fresh pull.
            syncing = false;
            return get().syncNow();
          } else {
            set({ status: "error", error: e?.message || "Sync failed" });
          }
        } finally {
          syncing = false;
        }
      },

      schedulePush: () => {
        if (!get().token) return;
        if (pushTimer) clearTimeout(pushTimer);
        pushTimer = setTimeout(() => {
          pushTimer = null;
          get().syncNow();
        }, 1500);
      },
    }),
    {
      name: "sync-account",
      partialize: (s) => ({
        email: s.email,
        token: s.token,
        salt: s.salt,
        encKeyJwk: s.encKeyJwk,
        vaultVersion: s.vaultVersion,
        lastSyncedAt: s.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && state?.encKeyJwk) {
          state.status = "synced";
        }
      },
    }
  )
);
