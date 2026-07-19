import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  Unlock,
  Key,
  Download,
  Apple,
  Globe,
  BookOpen,
  ArrowRight,
  FileKey,
  HelpCircle,
  Shield,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PGP Tools — Encrypt, Decrypt, Generate Keys Online",
  description:
    "Free browser-based PGP tools: encrypt messages, decrypt PGP, generate key pairs, and learn about OpenPGP encryption. No installation, no account, no server storage.",
  alternates: {
    canonical: "https://kleopatra.app/tools",
  },
};

type Category = "tool" | "guide" | "download";

type Tool = {
  slug: string;
  icon: LucideIcon;
  title: string;
  description: string;
  category: Category;
};

const tools: Tool[] = [
  {
    slug: "pgp-encrypt",
    icon: Lock,
    title: "PGP Encrypt Online",
    description:
      "Encrypt any message with a PGP public key. Anyone with the matching private key can decrypt it — and only them.",
    category: "tool",
  },
  {
    slug: "pgp-decrypt",
    icon: Unlock,
    title: "PGP Decrypt Online",
    description:
      "Decrypt a PGP-encrypted message using your private key. Fully client-side — your private key never leaves your browser.",
    category: "tool",
  },
  {
    slug: "pgp-key-generator",
    icon: Key,
    title: "PGP Key Generator",
    description:
      "Generate a secure RSA 4096-bit PGP key pair online. Download your public and private keys instantly.",
    category: "tool",
  },
  {
    slug: "pgp-online",
    icon: Globe,
    title: "PGP Online Tool",
    description:
      "A complete PGP tool in your browser. Encrypt, decrypt, sign and verify messages without installing any software.",
    category: "tool",
  },
  {
    slug: "what-is-pgp",
    icon: BookOpen,
    title: "What is PGP Encryption?",
    description:
      "Learn how PGP (Pretty Good Privacy) encryption works, why it matters, and how to use it to protect your communications.",
    category: "guide",
  },
  {
    slug: "openpgp-vs-pgp",
    icon: HelpCircle,
    title: "OpenPGP vs PGP — What's the Difference?",
    description:
      "Understand the difference between PGP, OpenPGP, and GPG — and why it matters when choosing encryption tools.",
    category: "guide",
  },
  {
    slug: "pgp-key-import",
    icon: Shield,
    title: "How to Import a PGP Key",
    description:
      "Step-by-step guide to importing PGP public and private keys — in Kleopatra, GPG, and directly in your browser.",
    category: "guide",
  },
  {
    slug: "kleopatra-download",
    icon: Download,
    title: "Kleopatra Download (Windows / Gpg4win)",
    description:
      "Looking for the desktop Kleopatra app? Get download links for Kleopatra on Windows via Gpg4win — or use our browser version instead.",
    category: "download",
  },
  {
    slug: "kleopatra-mac",
    icon: Apple,
    title: "Kleopatra for Mac",
    description:
      "Kleopatra is not natively available on macOS. Discover the best alternatives — including our free browser-based PGP tool that works on any device.",
    category: "download",
  },
  {
    slug: "kleopatra-alternative",
    icon: FileKey,
    title: "Kleopatra Alternatives",
    description:
      "Explore alternatives to the Kleopatra desktop app, including web-based PGP tools that require no installation.",
    category: "download",
  },
];

const categoryStyle: Record<Category, { iconBg: string; iconColor: string; badge: string; cta: string }> = {
  tool: { iconBg: "#fdecec", iconColor: "#d61f2b", badge: "Tool", cta: "Open tool" },
  guide: { iconBg: "#eef0fb", iconColor: "#4b53c9", badge: "Guide", cta: "Read guide" },
  download: { iconBg: "#e9f6ef", iconColor: "#1b7a48", badge: "Download", cta: "Get it" },
};

const sections: { label: string; category: Category }[] = [
  { label: "Encryption tools", category: "tool" },
  { label: "Learn PGP", category: "guide" },
  { label: "Get the desktop app", category: "download" },
];

function ToolCard({ tool }: { tool: Tool }) {
  const s = categoryStyle[tool.category];
  const Icon = tool.icon;
  return (
    <Link href={`/tools/${tool.slug}`} className="tools-card">
      <div className="flex items-center justify-between" style={{ marginBottom: "18px" }}>
        <span
          className="inline-flex items-center justify-center"
          style={{ width: "50px", height: "50px", borderRadius: "14px", background: s.iconBg, color: s.iconColor }}
        >
          <Icon className="w-6 h-6" strokeWidth={1.9} />
        </span>
        <span
          className="inline-flex items-center"
          style={{ height: "24px", padding: "0 10px", borderRadius: "999px", background: s.iconBg, color: s.iconColor, fontSize: "12px", fontWeight: 700, letterSpacing: "0.02em" }}
        >
          {s.badge}
        </span>
      </div>
      {/* Kept as <h2> to preserve the listing's heading fingerprint */}
      <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", color: "#1a1c1f" }}>
        {tool.title}
      </h2>
      <p style={{ margin: "0 0 18px", fontSize: "15px", lineHeight: 1.55, color: "#5c5f66" }}>
        {tool.description}
      </p>
      <span
        className="inline-flex items-center gap-1.5"
        style={{ marginTop: "auto", fontSize: "15px", fontWeight: 700, color: s.iconColor }}
      >
        {s.cta}
        <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
      </span>
    </Link>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-baseline gap-3" style={{ marginBottom: "20px" }}>
      {/* Decorative label (not a heading) to keep the H1/H2 fingerprint intact */}
      <span style={{ fontSize: "15px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a8d93" }}>
        {label}
      </span>
      <span style={{ flex: 1, height: "1px", background: "#ededf1" }} />
    </div>
  );
}

export default function ToolsPage() {
  return (
    <div style={{ minWidth: "360px", overflowX: "hidden" }}>
      {/* ── Hero ── */}
      <section className="relative text-center" style={{ padding: "76px 24px 56px" }}>
        <div
          className="pointer-events-none"
          style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "560px",
            height: "360px",
            maxWidth: "100%",
            background: "radial-gradient(closest-side, rgba(214,31,43,0.10), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex flex-col items-center gap-5" style={{ maxWidth: "760px" }}>
          <Image
            src="/kleopatra-logo.png"
            alt="Kleopatra"
            width={104}
            height={104}
            priority
            style={{ borderRadius: "26px", boxShadow: "0 16px 40px rgba(180,20,30,0.22), 0 2px 8px rgba(0,0,0,0.06)", background: "#fff" }}
          />
          <div className="flex flex-wrap justify-center gap-2">
            {["100% client-side", "Nothing sent to servers", "No account needed"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5"
                style={{ height: "30px", padding: "0 12px", borderRadius: "999px", background: "#f1f2f4", color: "#4e5058", fontSize: "13px", fontWeight: 600 }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#1b7a48" }} />
                {t}
              </span>
            ))}
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(38px, 6vw, 60px)", lineHeight: 1.04, fontWeight: 800, letterSpacing: "-0.035em", color: "#1a1c1f" }}>
            Free PGP Encryption Tools
          </h1>
          <p style={{ margin: 0, maxWidth: "580px", fontSize: "19px", lineHeight: 1.55, color: "#4e5058" }}>
            Everything you need to encrypt messages, manage PGP keys, and protect your communications
            — running entirely in your browser. Open source, free forever.
          </p>
          <div className="flex flex-wrap justify-center gap-3" style={{ marginTop: "4px" }}>
            <Link href="/" className="tools-btn-primary" style={{ height: "52px", padding: "0 26px", fontSize: "17px", borderRadius: "13px" }}>
              <Lock className="w-[19px] h-[19px]" strokeWidth={2} />
              Open the PGP App
            </Link>
            <Link href="/tools/pgp-key-generator" className="tools-btn-secondary" style={{ height: "52px", padding: "0 24px", fontSize: "17px" }}>
              Generate a key pair
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categorized tool sections ── */}
      {sections.map((section, i) => (
        <section
          key={section.category}
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: i === 0 ? "24px 24px 8px" : "36px 24px 8px" }}
        >
          <SectionHeader label={section.label} />
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
          >
            {tools
              .filter((t) => t.category === section.category)
              .map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
          </div>
        </section>
      ))}

      {/* ── CTA band ── */}
      <section className="mx-auto" style={{ maxWidth: "1120px", padding: "56px 24px 64px" }}>
        <div
          className="relative overflow-hidden text-center"
          style={{
            borderRadius: "24px",
            background: "linear-gradient(150deg, #d61f2b 0%, #a5121c 100%)",
            padding: "52px 40px",
            boxShadow: "0 20px 50px rgba(165,18,28,0.30)",
          }}
        >
          <div style={{ position: "absolute", right: "-60px", top: "-60px", width: "260px", height: "260px", borderRadius: "999px", background: "rgba(255,255,255,0.10)" }} />
          <div style={{ position: "absolute", left: "-50px", bottom: "-80px", width: "220px", height: "220px", borderRadius: "999px", background: "rgba(255,255,255,0.07)" }} />
          <div className="relative flex flex-col items-center gap-4">
            <h2 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>
              Ready to encrypt your first message?
            </h2>
            <p style={{ margin: 0, maxWidth: "520px", fontSize: "17px", lineHeight: 1.55, color: "rgba(255,255,255,0.88)" }}>
              No installation. No account. No data ever leaves your browser.
            </p>
            <Link
              href="/"
              className="tools-cta-btn inline-flex items-center gap-2"
              style={{ height: "52px", marginTop: "4px", padding: "0 28px", borderRadius: "13px", background: "#fff", color: "#b3141f", fontSize: "17px", fontWeight: 800 }}
            >
              <Lock className="w-[19px] h-[19px]" strokeWidth={2.1} />
              Open Kleopatra PGP App
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
