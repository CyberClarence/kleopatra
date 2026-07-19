"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Cloud,
  KeyRound,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useSyncStore } from "@/feature/sync";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Mode = "signin" | "signup";
type SignupStep = "email" | "code" | "password";

export default function AccountPage() {
  const router = useRouter();
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

  const submitEmail = () =>
    run("Sending verification code…", async () => {
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
    run("Encrypting & creating your account…", async () => {
      if (password.length < 8) throw new Error("Password must be at least 8 characters");
      if (password !== confirm) throw new Error("Passwords don't match");
      await sync.register(email, regToken, password);
      router.push("/");
    });

  const submitSignin = () =>
    run("Signing in…", async () => {
      await sync.login(email, password);
      router.push("/");
    });

  const heading = (
    <header className="flex items-center gap-3 mb-8">
      <div className="icon-wrap">
        <Cloud className="w-5 h-5 text-cyan-500" />
      </div>
      <div>
        <p className="section-label mb-0.5">Online Sync</p>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--text-heading)" }}
        >
          {sync.token ? "Your Account" : "Sync Your Keys"}
        </h1>
      </div>
    </header>
  );

  const e2eNote = (
    <div
      className="flex items-start gap-3 p-4 rounded-xl text-xs leading-relaxed"
      style={{
        background: "var(--accent-subtle)",
        border: "1px solid var(--accent-border)",
        color: "var(--text-secondary)",
      }}
    >
      <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-500" />
      <p>
        Your keys are encrypted with <strong>AES-256</strong> on this device
        before upload, using a key derived from your password. The server only
        ever stores ciphertext — neither your password nor your keys ever leave
        your device. <strong>If you forget your password, your synced data
        cannot be recovered.</strong>
      </p>
    </div>
  );

  // ---------- Signed-in view ----------
  if (sync.token) {
    return (
      <div className="flex flex-col w-full h-full overflow-auto">
        <div className="flex-1 px-5 py-6 md:px-8 max-w-2xl mx-auto w-full">
          {heading}
          <div className="space-y-4">
            <div
              className="p-5 rounded-2xl space-y-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {sync.email}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {sync.status === "syncing" ? (
                  <LoadingSpinner className="w-4 h-4 text-cyan-500" />
                ) : sync.status === "error" ? (
                  <AlertCircle className="w-4 h-4" style={{ color: "var(--danger-text)" }} />
                ) : (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
                <span style={{ color: "var(--text-secondary)" }}>
                  {sync.status === "syncing"
                    ? "Syncing…"
                    : sync.status === "error"
                      ? sync.error || "Sync error"
                      : sync.lastSyncedAt
                        ? `Synced ${new Date(sync.lastSyncedAt).toLocaleString()}`
                        : "Synced"}
                </span>
              </div>
            </div>

            {e2eNote}

            <div className="flex gap-2">
              <button
                onClick={() => sync.syncNow()}
                disabled={sync.status === "syncing"}
                className="btn-primary"
              >
                <RefreshCw className="w-4 h-4" />
                Sync now
              </button>
              <button
                onClick={async () => {
                  await sync.logout();
                }}
                className="btn-neutral"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Signing out keeps your keys on this device — it only stops
              syncing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Signed-out views ----------
  return (
    <div className="relative flex flex-col w-full h-full overflow-auto">
      <div className="flex-1 px-5 py-6 md:px-8 max-w-2xl mx-auto w-full">
        {heading}

        {/* Mode switch */}
        <div className="flex gap-2 mb-6">
          {(["signup", "signin"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
                setStep("email");
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                mode === m
                  ? {
                      background: "var(--accent-subtle)",
                      border: "1px solid var(--accent-border)",
                      color: "var(--text-accent)",
                    }
                  : {
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }
              }
            >
              {m === "signup" ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>

        <div className="space-y-5 max-w-md">
          {mode === "signin" ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitSignin()}
                  className="input-field"
                  placeholder="Your account password"
                />
              </div>
              <button onClick={submitSignin} disabled={!!busy} className="btn-primary">
                <KeyRound className="w-4 h-4" />
                Sign in & sync
              </button>
              <button
                onClick={() => {
                  setMode("signup");
                  setStep("email");
                  setError(null);
                }}
                className="block text-xs underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                Forgot password? Verify your email to set a new one.
              </button>
            </>
          ) : step === "email" ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitEmail()}
                  className="input-field"
                  placeholder="you@example.com"
                  autoFocus
                />
                <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  We&apos;ll send you a 6-digit verification code.
                </p>
              </div>
              <button onClick={submitEmail} disabled={!!busy} className="btn-primary">
                <Mail className="w-4 h-4" />
                Send code
              </button>
            </>
          ) : step === "code" ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && submitCode()}
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  autoFocus
                />
                <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Enter the 6-digit code sent to <strong>{email}</strong>. It
                  expires in 10 minutes.
                </p>
                {devCode && (
                  <p className="mt-2 text-xs font-mono" style={{ color: "var(--text-accent)" }}>
                    Dev mode — your code is {devCode}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep("email")} className="btn-neutral">
                  Back
                </button>
                <button
                  onClick={submitCode}
                  disabled={!!busy || code.length !== 6}
                  className="btn-primary"
                >
                  <Check className="w-4 h-4" />
                  Verify
                </button>
              </div>
            </>
          ) : (
            <>
              {accountExists && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl text-xs leading-relaxed"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--danger-border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--danger-text)" }} />
                  <p>
                    This email already has an account. Setting a new password
                    replaces the old one — synced data encrypted with the old
                    password can only be kept if it&apos;s already on one of
                    your devices.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="At least 8 characters"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPassword()}
                  className="input-field"
                  placeholder="Repeat your password"
                />
              </div>
              {e2eNote}
              <button
                onClick={submitPassword}
                disabled={!!busy || !password || !confirm}
                className="btn-primary"
              >
                <ShieldCheck className="w-4 h-4" />
                Set password & enable sync
              </button>
            </>
          )}
        </div>
      </div>

      {busy && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ background: "var(--bg-overlay)" }}>
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl" style={{ background: "var(--overlay-card-bg)", border: "1px solid var(--overlay-card-border)" }}>
            <LoadingSpinner className="w-8 h-8 text-cyan-500" />
            <p className="text-sm" style={{ color: "var(--text-accent)" }}>{busy}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-5 right-5 max-w-sm animate-slide-up flex items-start gap-3 p-4 rounded-xl shadow-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--danger-border)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--danger-text)" }} />
          <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{error}</p>
          <button onClick={() => setError(null)} className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
