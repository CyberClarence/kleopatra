# Kleopatra

Free, open-source PGP client that runs in the browser — with optional
end-to-end-encrypted online sync and an Electron desktop app.

## Develop

```bash
bun install
bun run dev          # web app on http://localhost:3000
bun run electron:dev # desktop shell (reuses :3000, or starts it)
```

## Online sync

Users can create an account (email + 6-digit verification code, then a
password) to sync their keys across devices.

Security model — the password never leaves the device:

```
password ─PBKDF2(600k, SHA-256, salt)─▶ master bits
   ├─HKDF("kleopatra/enc")──▶ AES-256-GCM key — encrypts the vault, client-side only
   └─HKDF("kleopatra/auth")─▶ auth key — sent to the server instead of a password
```

The vault (all keys as JSON) is encrypted with AES-256-GCM in the browser
before upload; the server stores only ciphertext, the PBKDF2 salt, and a
SHA-256 hash of the auth key. A forgotten password means the synced data is
unrecoverable (a new one can be set via email verification, replacing the
remote vault).

Backend lives in `app/api/sync/*` (Next.js route handlers). Configuration
(see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY`, `EMAIL_FROM` | Verification-code emails via [Resend](https://resend.com). Dev fallback: code is printed to the console and shown in the UI. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Persistent storage via [Upstash Redis](https://upstash.com). **Required in production** — the dev fallback is a local JSON file (`.data/`). |
| `SYNC_SERVER_SECRET` | Secret for anti-enumeration decoy salts. |
| `NEXT_PUBLIC_SYNC_API_URL` | Set at build time to point the client at a remote sync server (used for Electron builds). |

## Desktop app (Electron)

```bash
bun run electron:dev      # develop against the dev server
bun run electron:build    # package: dist-electron/ (dmg/zip on macOS), unsigned-for-distribution
bun run electron:release  # signed (Developer ID) + notarized build for distribution
```

`electron:release` sources `.env.signing` (gitignored, next to the `certs/`
folder — both copied from the nocodexport project): `CSC_LINK` /
`CSC_KEY_PASSWORD` for the Developer ID Application certificate, and
`APPLE_API_KEY` / `APPLE_API_KEY_ID` / `APPLE_API_ISSUER` (App Store Connect
API key) for notarization, with `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` /
`APPLE_TEAM_ID` as fallback.

The packaged app bundles the Next.js standalone server for the UI and runs
it on a random localhost port, while sign-in and sync go to the hosted
server: `electron:build` bakes `NEXT_PUBLIC_SYNC_API_URL=https://kleopatra.app`
unless you override it (`middleware.ts` provides the CORS headers this
cross-origin setup needs). The website offers the desktop download via
sidebar cards, hidden when already running inside the app.
