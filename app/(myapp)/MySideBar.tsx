"use client";

import { useKeyStore } from "@/feature/keystore";
import { useSyncStore } from "@/feature/sync";
import { useTheme } from "@/feature/theme";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  KeyRound,
  Users,
  Plus,
  Shield,
  Loader2,
  Menu,
  X,
  Lock,
  Github,
  Wrench,
  Sun,
  Moon,
  Cloud,
  CloudOff,
  AlertCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { AppleLogo, WindowsLogo, DESKTOP_DOWNLOAD_URL } from "@/components/BrandIcons";

export const MySideBar = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const myPrivateKeys = useKeyStore((s) => s.myPrivateKeys);
  const myPublicKeys = useKeyStore((s) => s.myPublicKeys);
  const syncEmail = useSyncStore((s) => s.email);
  const syncToken = useSyncStore((s) => s.token);
  const syncStatus = useSyncStore((s) => s.status);
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    useKeyStore.persist.rehydrate();
    setIsDesktopApp(Boolean((window as any).kleopatraDesktop));
    setIsLoading(false);
  }, []);

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl transition-all"
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          color: "var(--text-accent)",
        }}
        aria-label="Toggle sidebar"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 backdrop-blur-sm z-30"
          style={{ background: "var(--bg-overlay)" }}
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-40 flex flex-col w-[280px] h-full transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-sidebar)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-6"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <div className="icon-wrap">
            <Lock className="w-4 h-4 text-cyan-500" />
          </div>
          <Link href="/" onClick={closeMobile} className="group">
            <div
              className="text-lg font-bold tracking-tight transition-colors"
              style={{ color: "var(--text-heading)" }}
            >
              Kleopatra
            </div>
            <div
              className="text-[10px] font-medium tracking-widest uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              PGP Client
            </div>
          </Link>
        </div>

        {/* Nav content */}
        <div className="flex flex-col flex-1 gap-6 px-4 py-5 overflow-hidden">
          {/* Private Keys */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between px-2">
              <div className="section-label">
                <Shield className="w-3 h-3" />
                Private Keys
              </div>
              <Link
                href="/create-private-key"
                onClick={closeMobile}
                className="p-1 rounded-lg transition-all"
                style={{
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-tertiary)",
                }}
                title="Create or import private key"
              >
                <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-0.5 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
              ) : myPrivateKeys.length ? (
                myPrivateKeys.map((key) => {
                  const isActive = pathname === `/private/${key.id}`;
                  return (
                    <Link
                      key={key.id}
                      href={`/private/${key.id}`}
                      onClick={closeMobile}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                      style={
                        isActive
                          ? {
                              background: "var(--accent-subtle)",
                              border: "1px solid var(--accent-border)",
                              color: "var(--text-accent)",
                            }
                          : {
                              color: "var(--text-secondary)",
                              border: "1px solid transparent",
                            }
                      }
                    >
                      <KeyRound
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: isActive ? "var(--text-accent)" : "var(--text-tertiary)" }}
                      />
                      <span className="truncate">{key.keyname || key.id}</span>
                    </Link>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    No private keys yet
                  </p>
                  <Link
                    href="/create-private-key"
                    onClick={closeMobile}
                    className="inline-flex items-center gap-1 mt-2 text-xs transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Plus className="w-3 h-3" /> Create one
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px mx-2" style={{ background: "var(--border-default)" }} />

          {/* Public Keys */}
          <div className="flex flex-col gap-2 min-h-0 flex-1">
            <div className="flex items-center justify-between px-2">
              <div className="section-label">
                <Users className="w-3 h-3" />
                Public Keys
              </div>
              <Link
                href="/import-public-key"
                onClick={closeMobile}
                className="p-1 rounded-lg transition-all"
                style={{
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "var(--text-tertiary)",
                }}
                title="Import public key"
              >
                <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
              ) : myPublicKeys.length ? (
                myPublicKeys.map((key) => {
                  const isActive = pathname === `/public/${key.id}`;
                  return (
                    <Link
                      key={key.id}
                      href={`/public/${key.id}`}
                      onClick={closeMobile}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                      style={
                        isActive
                          ? {
                              background: "rgba(99,102,241,0.08)",
                              border: "1px solid rgba(99,102,241,0.2)",
                              color: "#6366F1",
                            }
                          : {
                              color: "var(--text-secondary)",
                              border: "1px solid transparent",
                            }
                      }
                    >
                      <Users
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: isActive ? "#6366F1" : "var(--text-tertiary)" }}
                      />
                      <span className="truncate">{key.keyname || key.id}</span>
                    </Link>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    No public keys imported
                  </p>
                  <Link
                    href="/import-public-key"
                    onClick={closeMobile}
                    className="inline-flex items-center gap-1 mt-2 text-xs transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Plus className="w-3 h-3" /> Import one
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-4 space-y-1"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          {/* Desktop app download */}
          {!isLoading && !isDesktopApp && (
            <a
              href={DESKTOP_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
              }}
            >
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-accent)" }}>
                <AppleLogo className="w-4 h-4" />
                <WindowsLogo className="w-[15px] h-[15px]" />
              </span>
              <span className="flex-1 min-w-0">
                <span
                  className="block text-xs font-semibold"
                  style={{ color: "var(--text-heading)" }}
                >
                  Get the desktop app
                </span>
                <span className="block text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  macOS &amp; Windows · encrypted sync
                </span>
              </span>
            </a>
          )}
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs transition-all hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>

          {/* Online sync */}
          <Link
            href="/account"
            onClick={closeMobile}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
          >
            {!syncToken ? (
              <CloudOff className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
            ) : syncStatus === "error" ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            ) : syncStatus === "syncing" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className="truncate">
              {syncToken ? syncEmail : "Enable online sync"}
            </span>
          </Link>

          {/* Tools link */}
          <Link
            href="/tools"
            onClick={closeMobile}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
          >
            <Wrench className="w-3 h-3" />
            PGP Tools & Guides
          </Link>

          {/* Trust signals */}
          <div className="px-3 pt-1 space-y-1.5">
            <p
              className="flex items-center gap-1.5 text-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Shield className="w-2.5 h-2.5" />
              Local first · Sync is end-to-end encrypted
            </p>
            <a
              href="https://github.com/nicobytes/kleopatra"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] transition-colors hover:opacity-75"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Github className="w-2.5 h-2.5" />
              Open source on GitHub
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
