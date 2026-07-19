import Link from "next/link";
import Image from "next/image";
import { Archivo } from "next/font/google";
import { Github } from "lucide-react";

const archivo = Archivo({ subsets: ["latin"] });

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`tools-root flex flex-col ${archivo.className}`}>
      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "saturate(180%) blur(12px)",
          WebkitBackdropFilter: "saturate(180%) blur(12px)",
          borderBottom: "1px solid #ececf0",
        }}
      >
        <div
          className="mx-auto flex items-center gap-3"
          style={{ maxWidth: "1120px", height: "66px", padding: "0 24px" }}
        >
          <Link href="/" className="flex items-center gap-2.5" style={{ color: "#23272a" }}>
            <Image
              src="/kleopatra-logo.png"
              alt="Kleopatra"
              width={34}
              height={34}
              style={{ display: "block", borderRadius: "9px" }}
            />
            <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Kleopatra
            </span>
          </Link>
          <nav className="flex flex-1 items-center justify-end gap-1.5">
            <Link href="/tools" className="tools-navlink">
              All Tools
            </Link>
            <Link href="/tools/what-is-pgp" className="tools-navlink">
              Guides
            </Link>
            <a
              href="https://github.com/nicobytes/kleopatra"
              target="_blank"
              rel="noopener noreferrer"
              className="tools-navlink"
            >
              <Github className="w-[17px] h-[17px]" />
              Open Source
            </a>
            <Link
              href="/"
              className="tools-btn-primary"
              style={{ height: "40px", marginLeft: "6px", padding: "0 18px", fontSize: "15px", borderRadius: "10px" }}
            >
              Open the App
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer style={{ background: "#17181b", color: "#b8bcc4" }}>
        <div
          className="mx-auto flex flex-wrap justify-between gap-10"
          style={{ maxWidth: "1120px", padding: "48px 24px 40px" }}
        >
          <div className="flex flex-col gap-3.5" style={{ maxWidth: "320px" }}>
            <span className="flex items-center gap-2.5">
              <Image
                src="/kleopatra-logo.png"
                alt="Kleopatra"
                width={32}
                height={32}
                style={{ borderRadius: "8px" }}
              />
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                Kleopatra
              </span>
            </span>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "#8b909a" }}>
              Free, open-source PGP tools that run entirely in your browser. No servers, no accounts,
              no tracking.
            </p>
          </div>
          <div className="flex flex-wrap" style={{ gap: "56px" }}>
            <div className="flex flex-col gap-3">
              <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6a6f79" }}>
                Tools
              </span>
              <Link href="/tools/pgp-encrypt" className="tools-footer-link">Encrypt</Link>
              <Link href="/tools/pgp-decrypt" className="tools-footer-link">Decrypt</Link>
              <Link href="/tools/pgp-key-generator" className="tools-footer-link">Key Generator</Link>
              <Link href="/tools/pgp-online" className="tools-footer-link">Online PGP Tool</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6a6f79" }}>
                Learn
              </span>
              <Link href="/tools/what-is-pgp" className="tools-footer-link">What is PGP?</Link>
              <Link href="/tools/openpgp-vs-pgp" className="tools-footer-link">OpenPGP vs PGP</Link>
              <Link href="/tools/pgp-key-import" className="tools-footer-link">Import a key</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6a6f79" }}>
                Project
              </span>
              <Link href="/tools/kleopatra-download" className="tools-footer-link">Download</Link>
              <a href="https://github.com/nicobytes/kleopatra" target="_blank" rel="noopener noreferrer" className="tools-footer-link">Source</a>
              <a href="https://gnupg.org" target="_blank" rel="noopener noreferrer" className="tools-footer-link">GnuPG</a>
              <Link href="/tools/privacy" className="tools-footer-link">Privacy Policy</Link>
              <Link href="/" className="tools-footer-link">Home</Link>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #26282d" }}>
          <div
            className="mx-auto flex flex-wrap justify-between gap-2"
            style={{ maxWidth: "1120px", padding: "20px 24px", fontSize: "13px", color: "#6a6f79" }}
          >
            <span>© 2026 Kleopatra PGP. Built on OpenPGP &amp; GnuPG.</span>
            <span className="flex flex-wrap items-center gap-3">
              <Link href="/tools/privacy" className="tools-footer-link">Privacy Policy</Link>
              <span>·</span>
              <span>RGPD compliant — your keys never leave your device.</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
