import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Shield,
  CheckCircle,
  Globe,
  KeyRound,
  Lock,
  Unlock,
  MapPin,
  FileLock2,
  Building2,
  Cloud,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const BASE_URL = "https://kleopatra.app";

type FAQ = { q: string; a: string };

/** Icon names usable in article `sections` cards. */
const SECTION_ICONS: Record<string, LucideIcon> = {
  globe: Globe,
  key: KeyRound,
  lock: Lock,
  unlock: Unlock,
  mappin: MapPin,
  filelock: FileLock2,
  building: Building2,
  cloud: Cloud,
  send: Send,
  shieldcheck: ShieldCheck,
};

type SectionCard = { icon: keyof typeof SECTION_ICONS; title: string; text: string };
type ArticleSection = { heading: string; lead?: string; cards: SectionCard[] };

type ToolContent = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  headline: string;
  intro: string;
  body: string[];
  /** Optional illustrated card sections rendered after the body. */
  sections?: ArticleSection[];
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  faqs: FAQ[];
  trustPoints: string[];
};

const tools: Record<string, ToolContent> = {
  "public-key-vs-private-key": {
    title: "Public Key vs Private Key",
    metaTitle: "Public Key vs Private Key — What They Are & Why You Need Them",
    metaDescription:
      "What is a public key? What is a private key? Understand how key pairs protect your messages, with real examples — and how Kleopatra makes them easy to use, free in your browser.",
    keywords: [
      "public key vs private key",
      "what is a public key",
      "what is a private key",
      "asymmetric encryption explained",
      "how does pgp encryption work",
      "send encrypted message online",
    ],
    headline: "Public Key vs Private Key — Encryption Explained Simply",
    intro:
      "Almost everything you write online — addresses, contracts, reports, credentials — travels through and gets stored on machines you don't control. A key pair fixes that: one key the whole world can see, one key that never leaves your device. Here's how the two work together, and how Kleopatra makes them usable by anyone.",
    body: [
      "Think of your **public key** as a personal mailbox with a slot: you can bolt it to your front door, print it in a newspaper, or paste it in your email signature. Anyone can drop a letter in. Your **private key** is the only key that opens that mailbox. The two are generated together as a mathematically linked pair — what one locks, only the other unlocks.",
      "When someone wants to send you something confidential, they encrypt it with your public key. From that moment the message is an unreadable block of text for everyone — the messaging app, the email provider, an attacker who intercepts it, even the sender themselves can no longer read it. Only your private key can turn it back into the original message.",
      "**Why isn't HTTPS enough?** The padlock in your browser only protects data while it travels between you and a server. Once it arrives, it sits in plain text on that server — readable by the company, its employees, its subcontractors, and whoever breaches them. Public-key encryption is **end-to-end**: the content stays sealed until it reaches the one person meant to read it, no matter how many services relay or store it in between.",
      "This also works in reverse, and that's the second superpower of a key pair: **signing**. Something encrypted (signed) with your private key can be verified by anyone using your public key — proving the message really came from you and wasn't altered. Encryption gives you secrecy; signatures give you authenticity.",
      "**How Kleopatra helps:** Kleopatra turns all of this into a few clicks. Generate a key pair in your browser (Curve 25519 or RSA 4096), keep your private key on your device, share your public key with one click, and encrypt, decrypt, sign, and verify from a clean interface — no command line, no installation. Everything runs locally in your browser; with optional Online Sync your keys are AES-256-encrypted on your device before they're backed up, so even our server can't read them. There's also a native desktop app for macOS and Windows.",
    ],
    sections: [
      {
        heading: "The Two Keys at a Glance",
        cards: [
          {
            icon: "globe",
            title: "Public key — share it freely",
            text: "Like a mailbox slot: anyone can use it to send you an encrypted message. Publishing it is safe — it can only lock, never unlock.",
          },
          {
            icon: "key",
            title: "Private key — never leaves you",
            text: "The only key that opens your mailbox. It stays on your device, ideally protected by a passphrase. Whoever holds it can read your mail and sign as you.",
          },
          {
            icon: "lock",
            title: "Together — lock & unlock",
            text: "They are generated as one mathematical pair. Encrypted with the public key → only the private key decrypts. Signed with the private key → anyone verifies with the public key.",
          },
        ],
      },
      {
        heading: "Two Everyday Examples",
        lead: "Public-key encryption isn't just for spies and sysadmins — it solves ordinary problems the moment a message is too sensitive for a plain chat or email.",
        cards: [
          {
            icon: "mappin",
            title: "Sending your home address to an online seller",
            text: "You buy something from a marketplace seller or a small shop and they ask for your delivery address in the chat. That chat is stored forever on someone's server. Instead: ask for their public key, paste it into Kleopatra, encrypt your address, and send the scrambled block. The platform, its moderators, and any future data breach see only gibberish — the seller alone can decrypt it.",
          },
          {
            icon: "filelock",
            title: "Submitting a confidential report to a company",
            text: "Many companies publish a PGP public key on their security or ethics page precisely for this. Import that key into Kleopatra, write your report — a vulnerability you found, a compliance concern, sensitive evidence — encrypt it, and email the block. Even if the mailbox is shared, forwarded, or intercepted, only the security team's private key can open it. Sign it with your own key if you want them to verify it's really you.",
          },
        ],
      },
      {
        heading: "What Kleopatra Does for You",
        cards: [
          {
            icon: "key",
            title: "One-click key pair",
            text: "Generate a modern Curve 25519 or RSA 4096 key pair in seconds, entirely in your browser. Export and back up your keys anytime.",
          },
          {
            icon: "unlock",
            title: "Encrypt, decrypt, sign, verify",
            text: "Paste a key or a message and go. No command line, no installs — and nothing you type ever reaches our servers.",
          },
          {
            icon: "cloud",
            title: "Encrypted sync & desktop app",
            text: "Optional Online Sync backs up your keys AES-256-encrypted on your device before upload, so only your password unlocks them — across the web app and the macOS/Windows desktop app.",
          },
        ],
      },
    ],
    cta: { label: "Create Your Key Pair Now", href: "/" },
    secondaryCta: { label: "Encrypt a Message", href: "/" },
    faqs: [
      {
        q: "Is it safe to share my public key?",
        a: "Yes — that's exactly what it's for. A public key can only encrypt messages to you and verify your signatures. It cannot decrypt anything, and it doesn't reveal your private key.",
      },
      {
        q: "What happens if I lose my private key?",
        a: "Messages encrypted to you become permanently unreadable — there is no reset button, which is precisely what makes the system trustworthy. Back up your private key (Kleopatra lets you export it) and consider the encrypted Online Sync so a lost device doesn't mean lost keys.",
      },
      {
        q: "How is this different from the padlock (HTTPS) in my browser?",
        a: "HTTPS protects data in transit between you and a server, but the server itself reads everything. Public-key encryption protects the content end-to-end: only the person holding the matching private key can ever read it, no matter where it travels or is stored.",
      },
      {
        q: "Do both sides need Kleopatra?",
        a: "No. Kleopatra produces standard OpenPGP messages. The other side can use any OpenPGP tool — GPG, the Gpg4win Kleopatra desktop app, ProtonMail, or Kleopatra in their own browser.",
      },
    ],
    trustPoints: [
      "Plain-language explanation",
      "Real-world examples included",
      "Keys generated 100% in your browser",
      "Open source and free",
    ],
  },

  "pgp-encrypt": {
    title: "PGP Encrypt Online",
    metaTitle: "PGP Encrypt Online — Free Browser-Based PGP Encryption",
    metaDescription:
      "Encrypt any message with a PGP public key directly in your browser. Free, open-source, and nothing is ever sent to our servers. Try Kleopatra's online PGP encrypt tool.",
    keywords: ["pgp encrypt online", "encrypt message pgp", "online pgp encryption", "public key encryption online"],
    headline: "Encrypt Messages with PGP Online — Free & Private",
    intro:
      "PGP (Pretty Good Privacy) encryption lets you send messages that only the intended recipient can read. With Kleopatra's browser-based tool, you can encrypt any message using a PGP public key — right in your browser, with nothing ever sent to our servers.",
    body: [
      "To encrypt a message with PGP, you need the recipient's public key. Once you have it, only the person holding the matching private key can decrypt your message. This is the foundation of asymmetric encryption — and it's the same standard used by journalists, security researchers, and privacy advocates worldwide.",
      "Kleopatra's online PGP encryption tool runs entirely in your browser using the OpenPGP.js library. Your public keys, your messages, and your encrypted output never leave your device. There is no backend server, no database, and no logs. Everything is computed locally, in real time.",
      "Unlike the desktop Kleopatra application (part of Gpg4win for Windows), this web tool works on any operating system — including macOS and Linux — without any installation required. It supports RSA 4096-bit encryption, the gold standard for secure key lengths.",
      "To get started: import the recipient's public key, compose your message, and click Encrypt. The output is an armored PGP block you can safely send over email, messaging apps, or any channel. The encrypted text is unreadable without the corresponding private key and its passphrase.",
    ],
    cta: { label: "Encrypt a Message Now", href: "/import-public-key" },
    faqs: [
      {
        q: "Can I encrypt a message for someone online without installing software?",
        a: "Yes. Kleopatra's browser-based PGP tool lets you encrypt messages using a public key without installing anything. It runs entirely in your browser.",
      },
      {
        q: "Is my message stored when I encrypt it online?",
        a: "No. Kleopatra performs all encryption locally in your browser. Nothing is sent to or stored on our servers.",
      },
      {
        q: "What key types does the online PGP encrypt tool support?",
        a: "Kleopatra supports OpenPGP-compatible keys including RSA 4096-bit. You can import any standard .asc or .pgp public key file.",
      },
      {
        q: "Can the recipient decrypt my message without Kleopatra?",
        a: "Yes. The output is standard OpenPGP armored format. It can be decrypted using any compatible tool — Kleopatra desktop, GPG command line, ProtonMail, or other OpenPGP software.",
      },
    ],
    trustPoints: [
      "All encryption runs locally in your browser",
      "No message content is ever transmitted",
      "Open-source code, auditable by anyone",
      "No account or sign-up required",
    ],
  },

  "pgp-decrypt": {
    title: "PGP Decrypt Online",
    metaTitle: "PGP Decrypt Online — Decrypt PGP Messages in Your Browser",
    metaDescription:
      "Decrypt PGP-encrypted messages using your private key — entirely in your browser. Free, open-source, and completely private. No server storage, no account needed.",
    keywords: ["pgp decrypt online", "decrypt pgp message", "decrypt pgp online", "online pgp decryption"],
    headline: "Decrypt PGP Messages Online — No Installation Required",
    intro:
      "Received a PGP-encrypted message? Kleopatra lets you decrypt it directly in your browser using your private key. Your private key never leaves your device — all decryption happens locally, in real time.",
    body: [
      "PGP decryption requires your private key — the secret counterpart to the public key used to encrypt the message. Only someone in possession of the correct private key (and its passphrase, if set) can decrypt and read the original message.",
      "Kleopatra's online decryption tool processes everything client-side using the OpenPGP.js cryptography library. Your private key is stored only in your browser's localStorage — it is never uploaded, logged, or transmitted to any server. You can verify this in the open-source code.",
      "To decrypt a message: import your private key into Kleopatra, navigate to the key detail page, and paste the encrypted PGP block into the decrypt panel. The plaintext will appear instantly. Nothing is saved after you close the tab.",
      "This is especially useful if you don't have the Kleopatra desktop app (part of Gpg4win) installed, or if you're on macOS or Linux where the traditional Kleopatra isn't available. Our browser tool is fully cross-platform and works on any modern browser.",
    ],
    cta: { label: "Decrypt a Message Now", href: "/create-private-key" },
    faqs: [
      {
        q: "Is my private key safe when I use an online PGP decrypt tool?",
        a: "With Kleopatra, yes. Your private key is stored only in your browser's localStorage and is never sent to any server. You can verify this in the open-source code.",
      },
      {
        q: "Can I decrypt PGP without installing Kleopatra or GPG?",
        a: "Yes. Kleopatra's browser tool lets you decrypt PGP messages without installing any software. It works on Windows, macOS, Linux, and mobile browsers.",
      },
      {
        q: "What if my private key has a passphrase?",
        a: "Kleopatra supports passphrase-protected private keys. You'll be prompted to enter your passphrase during the import step.",
      },
      {
        q: "Does Kleopatra store decrypted messages?",
        a: "No. Decrypted content is shown in the UI temporarily and is never saved to a server or database.",
      },
    ],
    trustPoints: [
      "Private key never leaves your browser",
      "Decryption is 100% client-side",
      "No data sent to servers",
      "Open source and auditable",
    ],
  },

  "pgp-key-generator": {
    title: "PGP Key Generator",
    metaTitle: "PGP Key Generator — Generate RSA 4096 Key Pair Online Free",
    metaDescription:
      "Generate a secure PGP key pair (public + private key) online for free. RSA 4096-bit, browser-based, open-source. No server, no account, nothing stored.",
    keywords: ["pgp key generator", "generate pgp key pair online", "rsa 4096 key generator", "pgp keypair generator online"],
    headline: "Generate a PGP Key Pair Online — RSA 4096-bit, Free",
    intro:
      "Create a secure OpenPGP key pair — your public key and private key — directly in your browser. Kleopatra generates RSA 4096-bit keys using the OpenPGP.js library. No server involved, no data stored.",
    body: [
      "A PGP key pair consists of two mathematically linked keys: a public key you share with the world, and a private key you keep secret. Anyone can encrypt a message to you using your public key; only you can decrypt it with your private key.",
      "RSA 4096-bit is the recommended key size for strong long-term security. Kleopatra generates your key pair entirely in your browser using cryptographically secure random number generation. The private key is stored in your browser's localStorage — it never touches our servers.",
      "Once generated, you can export your public key as an armored .asc file to share with others, or import your private key into any OpenPGP-compatible application (GPG, ProtonMail, Thunderbird with Enigmail, and more).",
      "Key generation typically completes in under a second on modern hardware. Your browser's Web Crypto API provides the entropy — the same APIs used by banks and secure communication platforms.",
    ],
    cta: { label: "Generate a Key Pair Now", href: "/create-private-key" },
    faqs: [
      {
        q: "Is it safe to generate PGP keys in a browser?",
        a: "Yes, when the tool is client-side and open-source like Kleopatra. Keys are generated using your browser's secure Web Crypto API. Nothing is sent to servers.",
      },
      {
        q: "What key size does Kleopatra generate?",
        a: "Kleopatra generates RSA 4096-bit key pairs, which is the current gold standard for PGP key strength.",
      },
      {
        q: "Can I use my generated key with other PGP tools?",
        a: "Yes. Keys are standard OpenPGP format and work with GPG, ProtonMail, Thunderbird, Kleopatra desktop, and any other OpenPGP-compatible software.",
      },
      {
        q: "How do I back up my PGP private key?",
        a: "Export your private key from Kleopatra and store it securely offline — for example, in an encrypted password manager or on a USB drive kept in a safe place.",
      },
    ],
    trustPoints: [
      "Key generation happens in your browser only",
      "RSA 4096-bit — maximum security",
      "Standard OpenPGP format — works everywhere",
      "No server, no account, no logs",
    ],
  },

  "kleopatra-download": {
    title: "Kleopatra Download",
    metaTitle: "Kleopatra Download — Windows (Gpg4win) & Browser Alternative",
    metaDescription:
      "Download Kleopatra for Windows via Gpg4win, or use the free browser-based Kleopatra alternative — no installation required. Works on any OS including Mac and Linux.",
    keywords: ["kleopatra download", "pgp4win download", "gpg4win download", "kleopatra windows download", "kleopatra pgp download"],
    headline: "Kleopatra Download — Windows, Mac & Browser",
    intro:
      "Kleopatra is the GUI key manager that ships with Gpg4win (also known as PGP4Win) on Windows. If you're looking to download Kleopatra, here's what you need to know — including a browser-based alternative that works on any operating system without installation.",
    body: [
      "The official Kleopatra desktop application is bundled with Gpg4win, the Windows GnuPG distribution maintained by the German Federal Office for Information Security (BSI). To get Kleopatra on Windows, download and install Gpg4win from gpg4win.org. During installation, make sure to check the Kleopatra option.",
      "Kleopatra (Gpg4win) is available for Windows 7, 8, 10, and Windows 11. It is free and open-source software licensed under the GNU GPL. It provides a graphical interface for managing OpenPGP keys, encrypting and decrypting files and emails, and verifying digital signatures.",
      "If you're on macOS or Linux, or you simply don't want to install software, our browser-based Kleopatra tool provides the same core functionality — PGP key generation, encryption, decryption, signing, and verification — entirely in your browser. It supports the same OpenPGP standard and uses the same key format.",
      "The browser version is particularly useful for quick operations, shared computers, or situations where you need PGP functionality without administrative privileges to install software.",
    ],
    cta: { label: "Use Kleopatra in Your Browser", href: "/" },
    secondaryCta: { label: "Generate a PGP Key", href: "/create-private-key" },
    faqs: [
      {
        q: "Where can I download Kleopatra for Windows?",
        a: "Kleopatra is included in Gpg4win. Download it from gpg4win.org — it's free and open-source.",
      },
      {
        q: "Is Kleopatra the same as Gpg4win or PGP4Win?",
        a: "Kleopatra is a component of the Gpg4win package (sometimes called PGP4Win). Gpg4win is the full installer; Kleopatra is the graphical key manager included within it.",
      },
      {
        q: "Is there a Kleopatra version for Mac or Linux?",
        a: "The official Kleopatra desktop app is Windows-only. For Mac and Linux, you can use GPG Suite (Mac), GNU Privacy Guard (Linux), or our browser-based alternative that works on any OS.",
      },
      {
        q: "Can I use the browser version instead of downloading Kleopatra?",
        a: "Yes. Kleopatra.app provides the same PGP operations (key generation, encryption, decryption, signing) in your browser — no download or installation required.",
      },
    ],
    trustPoints: [
      "No installation required for browser version",
      "Works on Windows, Mac, Linux, and mobile",
      "Same OpenPGP standard as Gpg4win Kleopatra",
      "Everything runs locally — nothing stored on servers",
    ],
  },

  "kleopatra-mac": {
    title: "Kleopatra for Mac",
    metaTitle: "Kleopatra Mac — Best PGP Alternative for macOS",
    metaDescription:
      "Kleopatra isn't available for Mac. Discover the best macOS PGP alternatives — including Kleopatra.app, a free browser-based tool that works on any device.",
    keywords: ["kleopatra mac", "kleopatra mac download", "pgp mac", "kleopatra macos", "pgp tool mac"],
    headline: "Kleopatra for Mac — Alternatives & Browser Solution",
    intro:
      "If you've searched for a Kleopatra download for Mac, you've discovered that the official Kleopatra app — part of Gpg4win — is Windows-only. Here's what Mac users can use instead, including a browser-based option that requires zero installation.",
    body: [
      "The desktop Kleopatra application is developed by the KDE project and shipped exclusively as part of Gpg4win for Windows. There is no official Kleopatra macOS build. Mac users who need OpenPGP functionality have a few solid options.",
      "GPG Suite (by GPGTools) is the most popular native macOS PGP solution. It integrates with Apple Mail and provides a Keychain-style app for managing keys. However, it requires installation and has historically charged for some features.",
      "GNU Privacy Guard (GPG) can also be installed on macOS via Homebrew — `brew install gnupg` — and used from the command line. This is the approach preferred by developers and power users.",
      "For users who want a graphical PGP tool on Mac without installing anything, Kleopatra.app provides the full feature set in your browser: generate RSA 4096-bit key pairs, encrypt and decrypt messages, sign and verify — all running locally in Safari, Chrome, or Firefox. Your keys are stored in localStorage and never transmitted anywhere.",
    ],
    cta: { label: "Use Kleopatra on Mac (Browser)", href: "/" },
    secondaryCta: { label: "Generate a PGP Key", href: "/create-private-key" },
    faqs: [
      {
        q: "Is Kleopatra available for Mac?",
        a: "No. The official Kleopatra desktop app is part of Gpg4win and is only available for Windows. Mac users should use GPG Suite, GPG via Homebrew, or a browser-based alternative.",
      },
      {
        q: "What is the best PGP tool for Mac?",
        a: "For native macOS integration: GPG Suite. For no-install browser-based PGP: Kleopatra.app. For developers: GPG via Homebrew.",
      },
      {
        q: "Does Kleopatra.app work on macOS Safari?",
        a: "Yes. Kleopatra.app is a progressive web application that works in all modern browsers including Safari on macOS and iOS.",
      },
      {
        q: "Can I import my existing PGP keys from Kleopatra (Windows) into the Mac browser version?",
        a: "Yes. Export your keys as .asc files from Kleopatra on Windows, then import them into Kleopatra.app. The OpenPGP format is fully compatible.",
      },
    ],
    trustPoints: [
      "Works natively in Safari on macOS",
      "No installation — no admin rights needed",
      "Same security as desktop PGP tools",
      "Compatible with GPG Suite key format",
    ],
  },

  "kleopatra-alternative": {
    title: "Kleopatra Alternatives",
    metaTitle: "Best Kleopatra Alternatives — PGP Tools for Windows, Mac & Web",
    metaDescription:
      "Looking for a Kleopatra alternative? Compare the best PGP tools for Windows, Mac, Linux, and browser — including free open-source options with no installation.",
    keywords: ["kleopatra alternative", "kleopatra linux", "gpg alternative", "pgp software alternative", "kleopatra web alternative"],
    headline: "Kleopatra Alternatives — Best PGP Tools in 2025",
    intro:
      "Kleopatra (Gpg4win) is a great desktop PGP tool for Windows, but it's not the only option. Whether you're on Mac, Linux, or just want something that works without installation, here are the best Kleopatra alternatives.",
    body: [
      "Kleopatra is the graphical key manager included in Gpg4win. It's solid software — but it's Windows-only, sometimes feels dated, and requires installation. Depending on your use case, one of these alternatives may serve you better.",
      "**Browser-based: Kleopatra.app** — Our free web tool provides the same core PGP operations (key generation, encryption, decryption, signing, verification) entirely in your browser. Works on any OS, no installation, open-source. Ideal for users who need PGP occasionally, are on Mac/Linux, or are using a shared computer.",
      "**macOS: GPG Suite** — Native macOS integration with Apple Mail. Includes a graphical key manager (GPG Keychain). The best choice for heavy Mac users who want desktop-grade PGP.",
      "**Cross-platform: Thunderbird with OpenPGP** — Mozilla Thunderbird has built-in OpenPGP support since version 78. It's the best option for email-centric PGP use on any OS.",
      "**Linux: GNU Privacy Guard (GnuPG)** — The command-line GPG is available on every Linux distribution. For a GUI, Seahorse (GNOME) and Kleopatra via KDE are both available in most package managers.",
      "**Mobile: OpenKeychain (Android)** — The de facto standard for Android PGP. Integrates with K-9 Mail.",
    ],
    cta: { label: "Try the Browser Alternative", href: "/" },
    faqs: [
      {
        q: "What is the best Kleopatra alternative for Mac?",
        a: "GPG Suite for native macOS integration, or Kleopatra.app for a browser-based no-install option.",
      },
      {
        q: "Is there a Kleopatra equivalent for Linux?",
        a: "Yes. Kleopatra is actually available on Linux via KDE packages. Seahorse is a popular GNOME alternative. Or use GPG from the command line.",
      },
      {
        q: "Is there a free web-based Kleopatra alternative?",
        a: "Yes — Kleopatra.app provides the same PGP features (key gen, encrypt, decrypt, sign, verify) in your browser for free.",
      },
      {
        q: "Which Kleopatra alternative works without installation?",
        a: "Kleopatra.app. It runs entirely in your browser and requires no installation or account.",
      },
    ],
    trustPoints: [
      "Works on any OS without installation",
      "Open-source alternative to Kleopatra desktop",
      "Same OpenPGP standard — fully compatible",
      "No subscription or account needed",
    ],
  },

  "pgp-online": {
    title: "PGP Online Tool",
    metaTitle: "PGP Online — Free Browser-Based PGP Encryption Tool",
    metaDescription:
      "The best free online PGP tool. Encrypt and decrypt messages, generate key pairs, sign and verify — all in your browser. No install, no account, no server storage.",
    keywords: ["pgp online", "online pgp tool", "pgp tool free", "pgp encryption online free", "pgp online tool"],
    headline: "PGP Online — Encrypt, Decrypt & Manage Keys in Your Browser",
    intro:
      "Kleopatra is a free, open-source PGP tool that runs entirely in your browser. Encrypt messages, decrypt PGP blocks, generate key pairs, and verify signatures — without installing anything or creating an account.",
    body: [
      "PGP (Pretty Good Privacy) encryption is the global standard for secure digital communication. It's used by journalists protecting sources, developers signing code releases, businesses exchanging confidential contracts, and individuals who value their privacy.",
      "Most PGP tools require installation — GPG, Kleopatra (Gpg4win), GPG Suite. Kleopatra.app changes this by bringing the full OpenPGP workflow to the browser. Under the hood it uses the OpenPGP.js library — the same library trusted by ProtonMail — to perform all cryptographic operations locally.",
      "The tool is fully featured: generate RSA 4096-bit key pairs, import existing keys from .asc files, encrypt messages to any public key, decrypt messages with your private key, sign messages to prove authorship, and verify signatures from others.",
      "Everything is persistent in your browser's localStorage — so your keys are available next session without needing to re-import. And because there's no backend, there's nothing to hack on the server side. Your private key never leaves your machine.",
    ],
    cta: { label: "Open PGP Online Tool", href: "/" },
    secondaryCta: { label: "Generate a Key Pair", href: "/create-private-key" },
    faqs: [
      {
        q: "What is the best free PGP tool online?",
        a: "Kleopatra.app is a free, open-source, browser-based PGP tool. It supports key generation, encryption, decryption, signing, and verification — all without installation.",
      },
      {
        q: "Is it safe to use an online PGP tool?",
        a: "It depends on the tool. Kleopatra.app is safe because all cryptographic operations happen in your browser — nothing is sent to our servers. The code is open-source and auditable.",
      },
      {
        q: "Does the online PGP tool work without an internet connection?",
        a: "Once the page is loaded, all cryptographic operations work offline. You only need internet to initially load the app.",
      },
      {
        q: "Can I use PGP online for email encryption?",
        a: "Yes. Encrypt your message with the recipient's public key, then send the resulting PGP block via email. The recipient decrypts it with their private key.",
      },
    ],
    trustPoints: [
      "Trusted by privacy-conscious users worldwide",
      "Same library used by ProtonMail (OpenPGP.js)",
      "Zero server-side processing",
      "Open source — audit the code yourself",
    ],
  },

  "what-is-pgp": {
    title: "What is PGP?",
    metaTitle: "What is PGP Encryption? — How PGP Works Explained Simply",
    metaDescription:
      "Learn what PGP encryption is, how it works, and why it's the gold standard for secure communication. Includes a simple explanation of public and private keys.",
    keywords: ["what is pgp", "pgp encryption explained", "how does pgp work", "pgp vs gpg", "pretty good privacy"],
    headline: "What is PGP Encryption? A Clear, Simple Explanation",
    intro:
      "PGP stands for Pretty Good Privacy. It's a method of encrypting and decrypting messages so that only the intended recipient can read them. Created in 1991 by Phil Zimmermann, it became the global standard for email encryption and is still widely used today.",
    body: [
      "PGP uses asymmetric (public-key) cryptography. This means there are two linked keys: a public key you share openly, and a private key you keep secret. Here's how it works in practice: if Alice wants to send Bob a private message, she encrypts it using Bob's public key. Only Bob's private key can decrypt it — not even Alice can read it after encrypting.",
      "The reverse also applies for digital signatures. If Bob wants to prove he wrote a message, he signs it with his private key. Anyone with Bob's public key can verify the signature — proving the message came from Bob and hasn't been tampered with.",
      "**PGP vs GPG vs OpenPGP** — PGP was originally proprietary software. OpenPGP is the open standard (RFC 4880) derived from it. GPG (GNU Privacy Guard) is a free, open-source implementation of the OpenPGP standard. When people say 'PGP' today, they usually mean any OpenPGP-compatible tool — including GPG, Kleopatra, ProtonMail, and Kleopatra.app.",
      "**Key sizes** — RSA 4096-bit keys are the current recommendation for long-term security. Shorter keys (2048-bit) are still considered secure for now but are being phased out. Kleopatra generates 4096-bit keys by default.",
      "**Trust model** — PGP uses a 'web of trust.' You can sign other people's public keys to vouch for their authenticity. For most personal use, just verifying a fingerprint out-of-band (over a phone call or in person) is sufficient.",
    ],
    cta: { label: "Try PGP Encryption Now", href: "/" },
    secondaryCta: { label: "Generate Your First Key Pair", href: "/create-private-key" },
    faqs: [
      {
        q: "What does PGP stand for?",
        a: "PGP stands for Pretty Good Privacy. It was created by Phil Zimmermann in 1991 and became the standard for encrypted email and file encryption.",
      },
      {
        q: "Is PGP the same as GPG?",
        a: "PGP refers to the original software and the broader encryption standard. GPG (GNU Privacy Guard) is a free, open-source implementation of the OpenPGP standard. They are compatible.",
      },
      {
        q: "Is PGP encryption still secure in 2025?",
        a: "Yes. RSA 4096-bit PGP is still considered cryptographically secure. It is used by governments, security researchers, journalists, and privacy tools like ProtonMail.",
      },
      {
        q: "What is a PGP key fingerprint?",
        a: "A key fingerprint is a short hash of a public key — usually displayed as a series of hex characters. It's used to verify that a public key belongs to the expected person.",
      },
    ],
    trustPoints: [
      "Based on the OpenPGP open standard (RFC 4880)",
      "Used by ProtonMail, journalists, and governments",
      "Proven 30+ year track record",
      "Compatible with all OpenPGP tools",
    ],
  },

  "openpgp-vs-pgp": {
    title: "OpenPGP vs PGP",
    metaTitle: "OpenPGP vs PGP vs GPG — What's the Difference?",
    metaDescription:
      "Confused about PGP, OpenPGP, and GPG? Here's a clear breakdown of the differences and how they relate to tools like Kleopatra, Gpg4win, and ProtonMail.",
    keywords: ["openpgp vs pgp", "openpgp standard", "pgp vs gpg", "gpg vs pgp vs openpgp", "openpgp explained"],
    headline: "OpenPGP vs PGP vs GPG — What's the Difference?",
    intro:
      "PGP, OpenPGP, and GPG are related but distinct. If you've ever wondered what the difference is between these terms — and how tools like Kleopatra, Gpg4win, ProtonMail and others fit in — this guide explains it clearly.",
    body: [
      "**PGP (Pretty Good Privacy)** — The original encryption software created by Phil Zimmermann in 1991. It was initially distributed as freeware, then commercialized, and is now owned by Broadcom (formerly Symantec). PGP the product is proprietary software primarily for enterprise use.",
      "**OpenPGP** — The open standard (defined in RFC 4880, updated in RFC 9580) derived from PGP. It specifies how key formats, message encryption, signatures, and key exchange should work. OpenPGP is maintained by the IETF and is what virtually all modern 'PGP' tools implement.",
      "**GPG (GNU Privacy Guard)** — A free, open-source implementation of the OpenPGP standard by the GNU Project. GPG is what most people install when they 'install PGP.' It's a command-line tool available on Windows, macOS, and Linux.",
      "**Kleopatra** — A graphical key manager that provides a user-friendly interface for GPG on Windows (via Gpg4win). Kleopatra implements OpenPGP via GPG under the hood.",
      "**Kleopatra.app** — A browser-based OpenPGP tool using OpenPGP.js — a JavaScript implementation of the OpenPGP standard. It's fully compatible with keys and messages from GPG, Kleopatra desktop, ProtonMail, and any other OpenPGP tool.",
      "In practice: when someone says 'send me your PGP key,' they mean an OpenPGP public key. Any tool — GPG, Kleopatra, ProtonMail, Kleopatra.app — can generate and use compatible keys. The names 'PGP,' 'GPG,' and 'OpenPGP' are often used interchangeably in everyday conversation.",
    ],
    cta: { label: "Generate an OpenPGP Key Pair", href: "/create-private-key" },
    faqs: [
      {
        q: "What is the difference between PGP and OpenPGP?",
        a: "PGP is the original proprietary software. OpenPGP is the open standard derived from it. Today, virtually all PGP tools implement OpenPGP.",
      },
      {
        q: "Is GPG the same as PGP?",
        a: "GPG implements the OpenPGP standard — the open version of PGP. They are compatible and the terms are often used interchangeably, though they refer to different implementations.",
      },
      {
        q: "Does Kleopatra use OpenPGP or PGP?",
        a: "Kleopatra (both the desktop app and Kleopatra.app) implements the OpenPGP standard. Keys and messages are fully compatible with GPG, ProtonMail, and other OpenPGP tools.",
      },
      {
        q: "What is RFC 4880?",
        a: "RFC 4880 is the IETF standard that defines the OpenPGP message format. It's the technical specification that ensures all OpenPGP tools are compatible with each other.",
      },
    ],
    trustPoints: [
      "Implements the OpenPGP standard (RFC 4880)",
      "Compatible with GPG, ProtonMail, Thunderbird",
      "Uses OpenPGP.js — audited open-source library",
      "Standard key format: .asc / armored PGP",
    ],
  },

  "pgp-key-import": {
    title: "How to Import a PGP Key",
    metaTitle: "How to Import a PGP Key — Step-by-Step Guide",
    metaDescription:
      "Learn how to import a PGP public or private key in Kleopatra, GPG, and the browser. Step-by-step guide for Windows, Mac, Linux, and online tools.",
    keywords: ["how to import pgp key", "pgp key import", "import public key pgp", "import pgp key kleopatra", "pgp key import guide"],
    headline: "How to Import a PGP Key — Complete Guide",
    intro:
      "Importing a PGP key allows you to encrypt messages to someone (using their public key) or to decrypt messages sent to you (using your private key). Here's how to import PGP keys in Kleopatra, GPG, and Kleopatra.app's browser tool.",
    body: [
      "**Importing in Kleopatra.app (Browser)** — The easiest method. Navigate to 'Import Public Key' or 'Create/Import Private Key' in the app. Either paste the armored key text (the block starting with `-----BEGIN PGP PUBLIC KEY BLOCK-----`) or upload the .asc file. Click Import. The key is stored in your browser's localStorage — no server involved.",
      "**Importing in Kleopatra Desktop (Windows/Gpg4win)** — Open Kleopatra. Go to File > Import. Select your .asc or .pgp file, or paste the armored text. The key will appear in your key list. For private keys, you may be prompted to set a local passphrase.",
      "**Importing with GPG (Command Line)** — Run `gpg --import publickey.asc` for public keys, or `gpg --import privatekey.asc` for private keys. Verify the import with `gpg --list-keys` or `gpg --list-secret-keys`.",
      "**Finding someone's public key** — Public keys can be shared via email, messaging apps, key servers (keys.openpgp.org), or directly. Ask your contact to export their public key as an .asc file and send it to you.",
      "**Key fingerprint verification** — After importing a key, verify the fingerprint matches what the key owner told you (via a phone call or in-person). This protects against man-in-the-middle attacks where someone substitutes a different key.",
    ],
    cta: { label: "Import a Public Key Now", href: "/import-public-key" },
    secondaryCta: { label: "Import a Private Key", href: "/create-private-key" },
    faqs: [
      {
        q: "How do I import a PGP public key in Kleopatra?",
        a: "In Kleopatra.app: click 'Import Public Key,' paste the armored key or upload the .asc file, and click Import. In Kleopatra desktop (Gpg4win): File > Import.",
      },
      {
        q: "What file format is a PGP key?",
        a: "PGP keys are commonly saved as .asc files (ASCII-armored) or .pgp files (binary). The armored format starts with '-----BEGIN PGP PUBLIC KEY BLOCK-----'.",
      },
      {
        q: "Can I import a private key from GPG into Kleopatra?",
        a: "Yes. Export from GPG with `gpg --export-secret-keys --armor > privatekey.asc`, then import the .asc file into Kleopatra.",
      },
      {
        q: "Why should I verify the key fingerprint after importing?",
        a: "Fingerprint verification ensures you have the real key from the intended person — not a fake key created by a third party pretending to be them.",
      },
    ],
    trustPoints: [
      "Keys stored only in your browser (localStorage)",
      "No key data sent to servers during import",
      "Compatible with .asc files from any PGP tool",
      "Standard OpenPGP format",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(tools).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools[slug];
  if (!tool) return {};
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    keywords: tool.keywords,
    alternates: {
      canonical: `${BASE_URL}/tools/${slug}`,
    },
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      url: `${BASE_URL}/tools/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: tool.metaTitle,
      description: tool.metaDescription,
    },
  };
}

function FAQSchema({ faqs }: { faqs: FAQ[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = tools[slug];
  if (!tool) notFound();

  return (
    <>
      <FAQSchema faqs={tool.faqs} />

      <article className="mx-auto w-full" style={{ maxWidth: "820px", padding: "48px 24px 24px" }}>
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2" style={{ fontSize: "13px", fontWeight: 600, color: "#8a8d93" }}>
            <Link href="/tools" style={{ color: "#8a8d93" }} className="hover:opacity-75 transition-opacity">
              Tools
            </Link>
            <span>/</span>
            <span style={{ color: "#d61f2b" }}>{tool.title}</span>
          </div>

          <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, color: "#1a1c1f" }}>
            {tool.headline}
          </h1>

          <p style={{ margin: 0, maxWidth: "680px", fontSize: "19px", lineHeight: 1.55, color: "#4e5058" }}>
            {tool.intro}
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2" style={{ paddingTop: "4px" }}>
            {tool.trustPoints.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-1.5"
                style={{ height: "30px", padding: "0 12px", borderRadius: "999px", background: "#f1f2f4", color: "#4e5058", fontSize: "13px", fontWeight: 600 }}
              >
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#1b7a48" }} />
                {point}
              </span>
            ))}
          </div>
        </header>

        {/* CTA — all tool-page action buttons open the app at "/" */}
        <div className="flex flex-wrap gap-3" style={{ marginTop: "28px" }}>
          <Link
            href="/"
            className="tools-btn-primary"
            style={{ height: "48px", padding: "0 22px", fontSize: "16px", borderRadius: "12px" }}
          >
            {tool.cta.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
          {tool.secondaryCta && (
            <Link
              href="/"
              className="tools-btn-secondary"
              style={{ height: "48px", padding: "0 20px", fontSize: "16px", borderRadius: "12px" }}
            >
              {tool.secondaryCta.label}
            </Link>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5" style={{ marginTop: "40px" }}>
          {tool.body.map((para, i) => {
            const parts = para.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i} style={{ margin: 0, fontSize: "17px", lineHeight: 1.7, color: "#4e5058" }}>
                {parts.map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j} style={{ fontWeight: 700, color: "#1a1c1f" }}>
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            );
          })}
        </div>

        {/* Illustrated sections */}
        {tool.sections?.map((section) => (
          <section key={section.heading} className="flex flex-col gap-4" style={{ marginTop: "44px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em", color: "#1a1c1f" }}>
              {section.heading}
            </h2>
            {section.lead && (
              <p style={{ margin: 0, maxWidth: "680px", fontSize: "16px", lineHeight: 1.65, color: "#4e5058" }}>
                {section.lead}
              </p>
            )}
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns:
                  section.cards.length === 2
                    ? "repeat(auto-fit, minmax(280px, 1fr))"
                    : "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              {section.cards.map((card) => {
                const Icon = SECTION_ICONS[card.icon];
                return (
                  <div
                    key={card.title}
                    className="flex flex-col gap-3"
                    style={{
                      borderRadius: "16px",
                      padding: "22px",
                      background: "#fff",
                      border: "1px solid #ececf0",
                      boxShadow: "0 1px 2px rgba(20,20,30,0.04)",
                    }}
                  >
                    <span
                      className="inline-flex items-center justify-center flex-none"
                      style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fdecec" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: "#d61f2b" }} />
                    </span>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1a1c1f" }}>
                      {card.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "14.5px", lineHeight: 1.65, color: "#5c5f66" }}>
                      {card.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Privacy callout */}
        <div
          className="flex gap-4"
          style={{ marginTop: "40px", borderRadius: "18px", padding: "24px", background: "#fdecec", border: "1px solid #f7d5d7" }}
        >
          <Shield className="w-5 h-5 flex-shrink-0" style={{ marginTop: "2px", color: "#d61f2b" }} />
          <div className="flex flex-col gap-1.5">
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1a1c1f" }}>
              Your privacy is guaranteed by design
            </p>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: "#5c5f66" }}>
              All cryptographic operations in Kleopatra run entirely in your browser. Nothing you
              type, encrypt, decrypt, or generate is ever sent to our servers. There are no server
              logs, no analytics on your keys, and no accounts required. The code is open-source — you
              can verify every claim yourself.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <section className="flex flex-col gap-4" style={{ marginTop: "48px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em", color: "#1a1c1f" }}>
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-3">
            {tool.faqs.map((faq) => (
              <div
                key={faq.q}
                className="flex flex-col gap-2"
                style={{ borderRadius: "16px", padding: "20px 22px", background: "#fff", border: "1px solid #ececf0", boxShadow: "0 1px 2px rgba(20,20,30,0.04)" }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1a1c1f" }}>
                  {faq.q}
                </h3>
                <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "#5c5f66" }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related tools */}
        <section className="flex flex-col gap-4" style={{ marginTop: "48px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", color: "#1a1c1f" }}>
            Related Tools
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tools)
              .filter(([s]) => s !== slug)
              .slice(0, 5)
              .map(([s, t]) => (
                <Link key={s} href={`/tools/${s}`} className="tools-related">
                  {t.title}
                </Link>
              ))}
          </div>
        </section>
      </article>
    </>
  );
}
