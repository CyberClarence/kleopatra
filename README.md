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

### Architecture

- **Web app**: Next.js on Vercel (kleopatra.app).
- **Sync API (production)**: Cloudflare Worker in `worker/` at
  **api.kleopatra.app** — all server-side logic: verification codes, accounts,
  sessions, encrypted vaults (D1 database), verification emails via Postmark
  from `auth@mail.kleopatra.app`, and direct desktop-app downloads streamed
  from the `kleopatra-releases` R2 bucket (`/download/mac`, `/download/windows`).
  Deploy from a machine with the Cloudflare token in env:
  `cd worker && wrangler deploy` (secrets: `POSTMARK_API_TOKEN`,
  `SYNC_SERVER_SECRET`; schema: `wrangler d1 execute kleopatra-sync --remote --file schema.sql`).
- **Dev fallback**: the same API contract exists as Next.js route handlers in
  `app/api/sync/*` backed by a local JSON file (`.data/`), so `bun run dev`
  works offline with the code shown in the UI instead of emailed.
- `NEXT_PUBLIC_SYNC_API_URL` selects the API: set to
  `https://api.kleopatra.app` in Vercel production and baked into Electron
  builds; unset in dev (same-origin dev routes).

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
it on a random localhost port, while sign-in and sync go to the worker API:
`electron:build` bakes `NEXT_PUBLIC_SYNC_API_URL=https://api.kleopatra.app`
unless you override it (the worker serves the CORS headers this cross-origin
setup needs). The website offers the desktop download via sidebar cards
(direct download from api.kleopatra.app), hidden when already running inside
the app. After a release build, upload the artifacts to R2 and keep
`DOWNLOAD_MAC_KEY` / `DOWNLOAD_WIN_KEY` in `worker/wrangler.toml` in sync:

```bash
wrangler r2 object put "kleopatra-releases/<file>" --file <file> --remote
```
