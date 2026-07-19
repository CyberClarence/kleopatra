import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/feature/theme";
import { PHProvider } from "@/feature/posthog";
import { SyncProvider } from "@/feature/SyncProvider";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const BASE_URL = "https://kleopatra.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Kleopatra — Free Online PGP Encryption Tool",
    template: "%s | Kleopatra PGP",
  },
  description:
    "Kleopatra is a free, open-source PGP encryption tool. Encrypt messages, generate PGP key pairs, and manage OpenPGP keys — entirely in your browser. Nothing is ever sent to our servers.",
  keywords: [
    "kleopatra",
    "kleopatra download",
    "kleopatra mac",
    "pgp4win",
    "pgp encrypt online",
    "pgp decrypt online",
    "pgp key generator",
    "openpgp",
    "pgp tool",
    "pgp online",
    "encrypt message",
    "pgp encryption",
    "public key encryption",
    "private key",
    "open source pgp",
  ],
  authors: [{ name: "Kleopatra PGP" }],
  creator: "Kleopatra PGP",
  publisher: "Kleopatra PGP",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Kleopatra PGP",
    title: "Kleopatra — Free Online PGP Encryption Tool",
    description:
      "Encrypt messages and manage PGP keys entirely in your browser. Open-source, no account required, nothing stored on servers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kleopatra — Free Online PGP Encryption Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kleopatra — Free Online PGP Encryption Tool",
    description:
      "Encrypt messages and manage PGP keys entirely in your browser. Open-source, no account required, nothing stored on servers.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Kleopatra PGP",
  url: BASE_URL,
  description:
    "A free, open-source PGP encryption tool that runs entirely in your browser. Generate key pairs, encrypt and decrypt messages, and manage OpenPGP keys — with zero server storage.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "RSA 4096-bit key generation",
    "PGP message encryption",
    "PGP message decryption",
    "Digital signature creation",
    "Digital signature verification",
    "OpenPGP key import and export",
    "Client-side only — no server storage",
  ],
  screenshot: `${BASE_URL}/og-image.png`,
  softwareVersion: "1.0",
  license: "https://opensource.org/licenses/MIT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`flex flex-col overflow-auto w-screen h-screen ${jetbrainsMono.className} select-none`}
        style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}
      >
        <PHProvider>
          <ThemeProvider>
            <SyncProvider />
            {children}
          </ThemeProvider>
        </PHProvider>
      </body>
    </html>
  );
}
