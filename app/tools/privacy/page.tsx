import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, X, Check } from "lucide-react";

const BASE_URL = "https://kleopatra.app";

export const metadata: Metadata = {
  title: "Privacy Policy — RGPD / GDPR Compliant",
  description:
    "Kleopatra's privacy policy. We are RGPD (GDPR) compliant and collect only anonymous usage analytics — never your private keys, passphrases, messages, or decrypted communications.",
  alternates: {
    canonical: `${BASE_URL}/tools/privacy`,
  },
};

const neverCollect = [
  "Your private keys or passphrases",
  "Public keys you import or generate",
  "Any message you type, paste, encrypt, or sign",
  "Encrypted (armored) ciphertext",
  "Decrypted or verified message content",
  "Key fingerprints or key IDs",
];

const doCollect = [
  "Anonymous page views (which tool or guide you opened)",
  "Aggregate feature usage (e.g. “encrypt” was clicked)",
  "Browser and device type, and approximate country",
  "Session recordings with every input and text masked",
];

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "40px 0 0", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em", color: "#1a1c1f" }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "14px 0 0", fontSize: "17px", lineHeight: 1.7, color: "#4e5058" }}>{children}</p>;
}

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto w-full" style={{ maxWidth: "820px", padding: "48px 24px 24px" }}>
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2" style={{ fontSize: "13px", fontWeight: 600, color: "#8a8d93" }}>
          <Link href="/tools" style={{ color: "#8a8d93" }} className="hover:opacity-75 transition-opacity">
            Tools
          </Link>
          <span>/</span>
          <span style={{ color: "#d61f2b" }}>Privacy Policy</span>
        </div>

        <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, color: "#1a1c1f" }}>
          Privacy Policy
        </h1>

        <p style={{ margin: 0, maxWidth: "680px", fontSize: "19px", lineHeight: 1.55, color: "#4e5058" }}>
          Kleopatra is <strong style={{ color: "#1a1c1f", fontWeight: 700 }}>RGPD (GDPR) compliant</strong> and built
          privacy-first. Every cryptographic operation runs entirely in your browser. We collect only anonymous usage
          information to improve the product — never anything sensitive such as your private key or your decrypted
          communications.
        </p>

        <span
          className="inline-flex items-center gap-2 self-start"
          style={{ height: "30px", padding: "0 12px", borderRadius: "999px", background: "#e9f6ef", color: "#1b7a48", fontSize: "13px", fontWeight: 700 }}
        >
          <ShieldCheck className="w-4 h-4" />
          Privacy by design
        </span>
      </header>

      {/* Never collected */}
      <H2>What we never collect</H2>
      <P>
        Kleopatra performs all encryption, decryption, signing, verification, and key generation locally, in your
        browser, using the open-source OpenPGP.js library. Your keys are stored only in your browser&rsquo;s
        localStorage and are never transmitted anywhere. The following data <strong style={{ color: "#1a1c1f", fontWeight: 700 }}>never leaves your device</strong> and is
        never sent to us or to any third party:
      </P>
      <ul className="flex flex-col gap-2.5" style={{ margin: "18px 0 0", padding: 0, listStyle: "none" }}>
        {neverCollect.map((item) => (
          <li key={item} className="flex items-center gap-3" style={{ fontSize: "16px", color: "#3a3d43" }}>
            <span className="inline-flex items-center justify-center flex-shrink-0" style={{ width: "24px", height: "24px", borderRadius: "999px", background: "#fdecec", color: "#d61f2b" }}>
              <X className="w-3.5 h-3.5" strokeWidth={2.4} />
            </span>
            {item}
          </li>
        ))}
      </ul>

      {/* Collected */}
      <H2>What we do collect</H2>
      <P>
        To understand which tools are useful and to fix problems, we use{" "}
        <a href="https://posthog.com" target="_blank" rel="noopener noreferrer" style={{ color: "#d61f2b", fontWeight: 600 }}>PostHog</a>,
        an open-source, privacy-focused analytics platform. All collection is anonymous — there are no accounts and we
        do not build advertising profiles. We collect:
      </P>
      <ul className="flex flex-col gap-2.5" style={{ margin: "18px 0 0", padding: 0, listStyle: "none" }}>
        {doCollect.map((item) => (
          <li key={item} className="flex items-center gap-3" style={{ fontSize: "16px", color: "#3a3d43" }}>
            <span className="inline-flex items-center justify-center flex-shrink-0" style={{ width: "24px", height: "24px", borderRadius: "999px", background: "#e9f6ef", color: "#1b7a48" }}>
              <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
            </span>
            {item}
          </li>
        ))}
      </ul>
      <P>
        Our session recordings exist to diagnose usability issues, not to read your content. Every input, textarea, and
        text node is <strong style={{ color: "#1a1c1f", fontWeight: 700 }}>masked before anything is recorded</strong> — pasted keys, typed messages, ciphertext, decrypted
        output, and fingerprints all appear as censored placeholders. We technically cannot see them.
      </P>

      {/* Where data lives */}
      <H2>Where your data is stored (EU)</H2>
      <P>
        All analytics data is stored in the European Union. Events are sent first-party through{" "}
        <code style={{ fontSize: "15px", background: "#f4f4f6", padding: "1px 6px", borderRadius: "6px" }}>kleopatra.app/posthog-gpdr</code>{" "}
        and proxied to PostHog&rsquo;s EU region (<code style={{ fontSize: "15px", background: "#f4f4f6", padding: "1px 6px", borderRadius: "6px" }}>eu.posthog.com</code>). Data never crosses to a
        non-EU server, in line with RGPD data-residency requirements.
      </P>

      {/* Rights */}
      <H2>Your rights under the RGPD / GDPR</H2>
      <P>
        Because we never collect personal or sensitive data and do not create user accounts, the data we hold is
        anonymous usage statistics. You still have the right to access, rectify, or request erasure of any data
        relating to you, and to object to processing. You can also disable analytics entirely by using your browser&rsquo;s
        &ldquo;Do Not Track&rdquo; setting or any content blocker — the app works exactly the same without it.
      </P>

      {/* Storage / cookies */}
      <H2>Local storage &amp; cookies</H2>
      <P>
        Your PGP keys are kept in your browser&rsquo;s localStorage so they persist between visits; they are never uploaded.
        PostHog stores an anonymous identifier to avoid counting the same visitor twice. It contains no personal
        information and is never linked to your keys or messages.
      </P>

      {/* Contact */}
      <H2>Contact</H2>
      <P>
        Questions about this policy or your data? Kleopatra is free and open-source — you can audit exactly what runs in
        your browser on{" "}
        <a href="https://github.com/nicobytes/kleopatra" target="_blank" rel="noopener noreferrer" style={{ color: "#d61f2b", fontWeight: 600 }}>GitHub</a>,
        or reach the community on{" "}
        <a href="https://discord.gg/mbYdvN8hZk" target="_blank" rel="noopener noreferrer" style={{ color: "#d61f2b", fontWeight: 600 }}>Discord</a>.
      </P>
    </article>
  );
}
