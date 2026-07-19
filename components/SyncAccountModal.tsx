"use client";

import { useState } from "react";
import { Check, Cloud, CloudOff, Loader2, LogOut, Mail, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useSyncStore } from "@/feature/sync";

/**
 * In-page account & sync dialog, styled with the Sigil design system used by
 * the homepage. Handles the whole flow without navigation: create account
 * (email → 6-digit code → password), sign in, and account management.
 */

type Mode = "signup" | "signin";
type SignupStep = "email" | "code" | "password";

export function SyncAccountModal({
  open,
  onClose,
  className,
}: {
  open: boolean;
  onClose: () => void;
  className?: string;
}) {
  const sync = useSyncStore();

  const [mode, setMode] = useState<Mode>("signup");
  const [step, setStep] = useState<SignupStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [regToken, setRegToken] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep("email");
    setError(null);
    setCode("");
    setPassword("");
    setConfirm("");
  };

  const submitEmail = () =>
    run("Sending code…", async () => {
      const res = await sync.requestCode(email);
      setAccountExists(res.accountExists);
      setDevCode(res.devCode ?? null);
      setStep("code");
    });

  const submitCode = () =>
    run("Checking code…", async () => {
      const res = await sync.verifyCode(email, code);
      setRegToken(res.regToken);
      setAccountExists(res.accountExists);
      setStep("password");
    });

  const submitPassword = () =>
    run("Encrypting & creating account…", async () => {
      if (password.length < 8) throw new Error("Password must be at least 8 characters");
      if (password !== confirm) throw new Error("Passwords don't match");
      await sync.register(email, regToken, password);
    });

  const submitSignin = () =>
    run("Signing in…", async () => {
      await sync.login(email, password);
    });

  const label = (text: string) => (
    <span className="sigil-label" style={{ display: "block", marginBottom: "6px" }}>
      {text}
    </span>
  );

  const errorBanner = error && (
    <div
      className="flex items-center gap-2.5"
      style={{
        padding: "10px 13px",
        background: "var(--state-revoked-subtle, rgba(191,74,63,0.11))",
        border: "1px solid color-mix(in srgb, var(--red) 35%, transparent)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "var(--red)", flex: "none" }} />
      <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{error}</span>
    </div>
  );

  const e2eNote = (
    <div
      className="flex items-start gap-2.5"
      style={{
        padding: "11px 13px",
        background: "var(--accent-subtle)",
        border: "1px solid color-mix(in srgb, var(--steel) 30%, transparent)",
        borderRadius: "var(--radius-md)",
        fontSize: "12px",
        lineHeight: 1.5,
        color: "var(--text-secondary)",
      }}
    >
      <ShieldCheck className="w-4 h-4 flex-none" style={{ color: "var(--steel)", marginTop: "1px" }} />
      <span>
        Your keys are encrypted with <strong>AES-256</strong> on this device before upload — the
        server only ever stores ciphertext. <strong>A forgotten password means the synced data
        cannot be recovered.</strong>
      </span>
    </div>
  );

  const signedInBody = (
    <div className="flex flex-col gap-3.5">
      <div
        className="flex flex-col gap-2.5"
        style={{
          padding: "13px 14px",
          background: "var(--surface-panel)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <span className="flex items-center gap-2.5" style={{ fontSize: "13px", color: "var(--text-primary)" }}>
          <Mail className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <span className="ph-mask">{sync.email}</span>
        </span>
        <span className="flex items-center gap-2.5" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {sync.status === "syncing" ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--steel)" }} />
          ) : sync.status === "error" ? (
            <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "var(--red)" }} />
          ) : (
            <Check className="w-4 h-4" style={{ color: "var(--state-valid)" }} />
          )}
          {sync.status === "syncing"
            ? "Syncing…"
            : sync.status === "error"
              ? sync.error || "Sync error"
              : sync.lastSyncedAt
                ? `Synced ${new Date(sync.lastSyncedAt).toLocaleString()}`
                : "Synced"}
        </span>
      </div>
      {e2eNote}
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Signing out keeps your keys on this device — it only stops syncing.
      </span>
    </div>
  );

  const signinBody = (
    <div className="flex flex-col gap-3.5">
      <div>
        {label("Email")}
        <input
          type="email"
          className="sigil-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
      </div>
      <div>
        {label("Password")}
        <input
          type="password"
          className="sigil-input"
          placeholder="Your account password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitSignin()}
        />
      </div>
      <button
        onClick={() => switchMode("signup")}
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          textDecoration: "underline",
          textAlign: "left",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        Forgot password? Verify your email to set a new one.
      </button>
      {errorBanner}
    </div>
  );

  const signupBody =
    step === "email" ? (
      <div className="flex flex-col gap-3.5">
        <div>
          {label("Email")}
          <input
            type="email"
            className="sigil-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitEmail()}
            autoFocus
          />
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            We&apos;ll send you a 6-digit verification code.
          </span>
        </div>
        {errorBanner}
      </div>
    ) : step === "code" ? (
      <div className="flex flex-col gap-3.5">
        <div>
          {label("Verification code")}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="sigil-input"
            style={{ textAlign: "center", fontSize: "22px", letterSpacing: "0.5em" }}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && code.length === 6 && submitCode()}
            autoFocus
          />
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Sent to <strong className="ph-mask">{email}</strong> — expires in 10 minutes.
          </span>
          {devCode && (
            <span style={{ display: "block", fontSize: "11px", color: "var(--steel)", marginTop: "4px" }}>
              Dev mode — your code is <strong>{devCode}</strong>
            </span>
          )}
        </div>
        {errorBanner}
      </div>
    ) : (
      <div className="flex flex-col gap-3.5">
        {accountExists && (
          <div
            className="flex items-center gap-2.5"
            style={{
              padding: "10px 13px",
              background: "var(--state-expiring-subtle, rgba(169,122,29,0.12))",
              border: "1px solid color-mix(in srgb, var(--amber) 35%, transparent)",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              color: "var(--text-primary)",
            }}
          >
            This email already has an account — setting a new password replaces it. Synced data
            encrypted with the old password survives only if it&apos;s already on one of your
            devices.
          </div>
        )}
        <div>
          {label("Password")}
          <input
            type="password"
            className="sigil-input"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          {label("Confirm password")}
          <input
            type="password"
            className="sigil-input"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPassword()}
          />
        </div>
        {e2eNote}
        {errorBanner}
      </div>
    );

  const footer = sync.token ? (
    <>
      <button
        className="sigil-btn sigil-btn-secondary"
        onClick={() => sync.logout()}
        disabled={!!busy}
      >
        <LogOut className="w-3.5 h-3.5" />
        Sign out
      </button>
      <button
        className="sigil-btn sigil-btn-primary"
        onClick={() => sync.syncNow()}
        disabled={sync.status === "syncing"}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Sync now
      </button>
    </>
  ) : mode === "signin" ? (
    <button className="sigil-btn sigil-btn-primary" onClick={submitSignin} disabled={!!busy || !email || !password}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      {busy || "Sign in & sync"}
    </button>
  ) : step === "email" ? (
    <button className="sigil-btn sigil-btn-primary" onClick={submitEmail} disabled={!!busy || !email}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
      {busy || "Send code"}
    </button>
  ) : step === "code" ? (
    <>
      <button className="sigil-btn sigil-btn-secondary" onClick={() => setStep("email")} disabled={!!busy}>
        Back
      </button>
      <button className="sigil-btn sigil-btn-primary" onClick={submitCode} disabled={!!busy || code.length !== 6}>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        {busy || "Verify"}
      </button>
    </>
  ) : (
    <button
      className="sigil-btn sigil-btn-primary"
      onClick={submitPassword}
      disabled={!!busy || !password || !confirm}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
      {busy || "Set password & enable sync"}
    </button>
  );

  return (
    <div className="sigil-dialog-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className={`sigil-dialog ${className || ""}`}>
        <div
          className="flex items-center"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-hairline)",
            background: "var(--metal-titlebar)",
            boxShadow: "var(--bevel-top)",
          }}
        >
          <span className="flex-1 flex items-center gap-2" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {sync.token ? (
              <Cloud className="w-4 h-4 flex-none" style={{ color: "var(--state-valid)" }} />
            ) : (
              <CloudOff className="w-4 h-4 flex-none" style={{ color: "var(--text-muted)" }} />
            )}
            {sync.token ? "Online Sync — Your Account" : "Online Sync"}
          </span>
          <button className="sigil-winbtn" onClick={onClose} aria-label="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div style={{ padding: "16px" }}>
          {!sync.token && (
            <div className="sigil-seg" style={{ marginBottom: "14px" }}>
              <button className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>
                Create account
              </button>
              <button className={mode === "signin" ? "active" : ""} onClick={() => switchMode("signin")}>
                Sign in
              </button>
            </div>
          )}
          {sync.token ? signedInBody : mode === "signin" ? signinBody : signupBody}
        </div>

        <div
          className="flex justify-end gap-2"
          style={{ padding: "12px 16px", borderTop: "1px solid var(--border-hairline)" }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}
