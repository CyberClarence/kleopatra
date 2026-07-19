"use client";
import {
  Shield,
  ArrowRight,
  KeyRound,
  Users,
  Minus,
  Square,
  X,
  LockKeyhole,
  Lock,
  SlidersHorizontal,
  Search,
  Wrench,
  Github,
  Loader2,
  Copy,
  FileText,
  Eye,
  Download,
  Pencil,
  Trash2,
  Hash,
  Globe,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as openpgp from "openpgp";
import { useKeyStore } from "@/feature/keystore";
import { useSyncStore } from "@/feature/sync";
import { useTheme } from "@/feature/theme";
import { AppleLogo, WindowsLogo, desktopDownloadUrl } from "@/components/BrandIcons";
import { SyncAccountModal } from "@/components/SyncAccountModal";

const archivo = Archivo({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"] });

type View = "private" | "public" | "decrypt" | "encrypt" | "settings";

/* Display metadata parsed from the armored keys. Parsing is read-only —
   entries written by older versions are never modified, so they cannot
   be corrupted. Unreadable entries just show "—". */
type KeyMeta = {
  name: string;
  email: string;
  keyId: string;
  fingerprint: string;
  algorithm: string;
  created: string;
  validUntil: string;
  subkeys: Array<{ keyId: string; usage: string }>;
  publicArmor: string;
};

type Toast = { id: number; color: string; title: string; desc: string };
type Banner = { color: string; bg: string; text: string } | null;

const GEN_ALGS = ["ECDSA/EdDSA (Curve 25519)", "RSA 4096"];

function algoLabel(info: { algorithm?: string; bits?: number; curve?: string }) {
  const name = info.algorithm || "—";
  if (/rsa/i.test(name)) return `RSA ${info.bits ?? ""}`.trim();
  if (info.curve) return `${name.toUpperCase()} (${info.curve})`;
  return name.toUpperCase();
}

function usageLabel(info: { algorithm?: string }) {
  return /ecdh|elgamal|rsaEncrypt/i.test(info.algorithm || "") ? "Encryption" : "Signing";
}

function fmtExpiry(exp: Date | number | null): string {
  if (exp === Infinity || exp === null) return "Never";
  if (exp instanceof Date) return exp.toISOString().slice(0, 10);
  return "—";
}

function groupFingerprint(fp: string) {
  return (fp.toUpperCase().match(/.{1,4}/g) || []).join(" ");
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("private");
  const [query, setQuery] = useState("");
  const [meta, setMeta] = useState<Record<string, KeyMeta>>({});
  const [selected, setSelected] = useState<{ id: string; kind: "private" | "public" } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generate Key Pair dialog
  const [genOpen, setGenOpen] = useState(false);
  const [genName, setGenName] = useState("");
  const [genEmail, setGenEmail] = useState("");
  const [genAlg, setGenAlg] = useState(GEN_ALGS[0]);
  const [genProtect, setGenProtect] = useState(false);
  const [genPass, setGenPass] = useState("");
  const [genBusy, setGenBusy] = useState(false);

  // Import dialog (public certificate or secret key)
  const [impOpen, setImpOpen] = useState(false);
  const [impKind, setImpKind] = useState<"private" | "public">("public");
  const [impName, setImpName] = useState("");
  const [impText, setImpText] = useState("");
  const [impFile, setImpFile] = useState("");
  const [impBusy, setImpBusy] = useState(false);

  // Decrypt / Verify
  const [decKeyId, setDecKeyId] = useState(""); // which of MY private keys decrypts
  const [decInput, setDecInput] = useState("");
  const [decPass, setDecPass] = useState("");
  const [needPass, setNeedPass] = useState(false);
  const [decOutput, setDecOutput] = useState("");
  const [sigStatus, setSigStatus] = useState<Banner>(null);
  const [decBusy, setDecBusy] = useState(false);

  // Encrypt / Sign
  const [encRecipient, setEncRecipient] = useState("");
  const [encInput, setEncInput] = useState("");
  const [encOutput, setEncOutput] = useState<{ label: string; text: string } | null>(null);
  const [encBusy, setEncBusy] = useState(false);

  // Row context menu + rename / view-public dialogs
  const [menu, setMenu] = useState<{ id: string; kind: "private" | "public"; x: number; y: number } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; kind: "private" | "public" } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [viewKey, setViewKey] = useState<{ name: string; armored: string } | null>(null);

  const myPrivateKeys = useKeyStore((s) => s.myPrivateKeys);
  const myPublicKeys = useKeyStore((s) => s.myPublicKeys);
  const importPublicKey = useKeyStore((s) => s.importPublicKey);
  const importPrivateKey = useKeyStore((s) => s.importPrivateKey);
  const deletePrivateKey = useKeyStore((s) => s.deletePrivateKey);
  const deletePublicKey = useKeyStore((s) => s.deletePublicKey);
  const renamePrivateKey = useKeyStore((s) => s.renamePrivateKey);
  const renamePublicKey = useKeyStore((s) => s.renamePublicKey);
  const { theme, toggle } = useTheme();
  const syncEmail = useSyncStore((s) => s.email);
  const syncToken = useSyncStore((s) => s.token);
  const syncStatus = useSyncStore((s) => s.status);
  const syncLastAt = useSyncStore((s) => s.lastSyncedAt);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  // Network connectivity for the status-bar indicator.
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const sync = () => setIsOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  // Responsive: below 1024px we render the native mobile layout. Defaults to
  // false on the server so SSR always emits the desktop tree (keeping the
  // <h1> and SEO fingerprint intact); corrected on the client after mount.
  const [isMobile, setIsMobile] = useState(false);
  // True inside the Electron shell (exposed by electron/preload.js) — the
  // download-the-app card is pointless there.
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  useEffect(() => {
    setIsDesktopApp(Boolean((window as any).kleopatraDesktop));
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    useKeyStore.persist.rehydrate();
    // Restore the tab from ?tab= so a refresh keeps you where you were.
    // Read after mount (not during render) so SSR/hydration always start on
    // the default "private" view — the SEO fingerprint never changes.
    const search = new URLSearchParams(window.location.search);
    const tab = search.get("tab");
    if (tab && (["private", "public", "decrypt", "encrypt", "settings"] as const).includes(tab as View)) {
      setView(tab as View);
    }
    // Deep link to a specific key (e.g. redirected from /private/:id or
    // /public/:id) — pre-select it so its details panel opens.
    const key = search.get("key");
    if (key && (tab === "private" || tab === "public")) {
      setSelected({ id: key, kind: tab });
    }
    setMounted(true);
  }, []);

  // Change view and mirror it into ?tab= (replaceState — no history spam,
  // no navigation, canonical URL for crawlers stays clean).
  const goView = useCallback((v: View) => {
    setView(v);
    setQuery("");
    setMenu(null);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", v);
    url.searchParams.delete("key"); // deep-link selection is stale once you navigate
    window.history.replaceState(null, "", url);
  }, []);

  // Dismiss the row context menu on Escape or when the list scrolls.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const toast = useCallback((color: string, title: string, desc: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, color, title, desc }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  // Read-only enrichment of stored keys for display.
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      const all = [...myPrivateKeys, ...myPublicKeys];
      const entries = await Promise.all(
        all.map(async (k) => {
          try {
            const parsed = await openpgp.readKey({ armoredKey: k.key });
            const userId = parsed.users[0]?.userID;
            const expiry = await parsed.getExpirationTime();
            // Always derive the shareable public key for the details panel.
            const pub = parsed.isPrivate()
              ? (parsed as openpgp.PrivateKey).toPublic()
              : parsed;
            const m: KeyMeta = {
              name: userId?.name || "",
              email: userId?.email || "—",
              keyId: "0x" + parsed.getKeyID().toHex().slice(-8).toUpperCase(),
              fingerprint: parsed.getFingerprint(),
              algorithm: algoLabel(parsed.getAlgorithmInfo()),
              created: parsed.getCreationTime().toISOString().slice(0, 10),
              validUntil: fmtExpiry(expiry),
              subkeys: parsed.subkeys.map((s) => ({
                keyId: "0x" + s.getKeyID().toHex().slice(-8).toUpperCase(),
                usage: `${usageLabel(s.getAlgorithmInfo())} · ${algoLabel(s.getAlgorithmInfo())}`,
              })),
              publicArmor: pub.armor(),
            };
            return [k.id, m] as const;
          } catch {
            return [
              k.id,
              {
                name: "",
                email: "—",
                keyId: k.id.slice(0, 8).toUpperCase(),
                fingerprint: "",
                algorithm: "—",
                created: "—",
                validUntil: "—",
                subkeys: [],
                publicArmor: "",
              } satisfies KeyMeta,
            ] as const;
          }
        }),
      );
      if (!cancelled) setMeta(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, myPrivateKeys, myPublicKeys]);

  const filterKeys = useCallback(
    <T extends { id: string; keyname?: string }>(list: T[]) => {
      const q = query.trim().toLowerCase();
      if (!q) return list;
      return list.filter(
        (k) =>
          (k.keyname || "").toLowerCase().includes(q) ||
          k.id.toLowerCase().includes(q) ||
          (meta[k.id]?.keyId || "").toLowerCase().includes(q) ||
          (meta[k.id]?.email || "").toLowerCase().includes(q),
      );
    },
    [query, meta],
  );
  const visiblePublicKeys = useMemo(() => filterKeys(myPublicKeys), [filterKeys, myPublicKeys]);
  const visiblePrivateKeys = useMemo(() => filterKeys(myPrivateKeys), [filterKeys, myPrivateKeys]);

  const selectedKey = useMemo(() => {
    if (!selected) return null;
    const list = selected.kind === "private" ? myPrivateKeys : myPublicKeys;
    const key = list.find((k) => k.id === selected.id);
    return key ? { ...key, kind: selected.kind } : null;
  }, [selected, myPrivateKeys, myPublicKeys]);

  /* ── PGP operations ─────────────────────────────────────────────── */

  const banner = (kind: "ok" | "warn" | "err" | "info", text: string): Banner => ({
    color:
      kind === "ok"
        ? "var(--state-valid)"
        : kind === "warn"
          ? "var(--amber)"
          : kind === "err"
            ? "var(--red)"
            : "var(--steel)",
    bg:
      kind === "ok"
        ? "var(--state-valid-subtle)"
        : kind === "warn"
          ? "var(--state-expiring-subtle, rgba(169,122,29,0.12))"
          : kind === "err"
            ? "var(--state-revoked-subtle, rgba(191,74,63,0.11))"
            : "var(--accent-subtle)",
    text,
  });

  const unlockPrivateKeys = useCallback(
    async (passphrase: string, only?: string) => {
      // `only` limits unlocking to a single chosen private key (the Decrypt
      // screen's selector); otherwise every stored private key is tried.
      const source = only ? myPrivateKeys.filter((k) => k.id === only) : myPrivateKeys;
      const unlocked: openpgp.PrivateKey[] = [];
      let locked = 0;
      for (const k of source) {
        try {
          let pk = await openpgp.readPrivateKey({ armoredKey: k.key });
          if (!pk.isDecrypted()) {
            if (!passphrase) {
              locked++;
              continue;
            }
            try {
              pk = await openpgp.decryptKey({ privateKey: pk, passphrase });
            } catch {
              locked++;
              continue;
            }
          }
          unlocked.push(pk);
        } catch {
          /* unreadable legacy entry — skipped, never touched */
        }
      }
      return { unlocked, locked };
    },
    [myPrivateKeys],
  );

  // Identify who signed a message by matching the signature key ID against
  // every imported public key (and my own keys).
  const signerName = useCallback(
    async (keyId: openpgp.KeyID) => {
      for (const k of [...myPublicKeys, ...myPrivateKeys]) {
        try {
          const parsed = await openpgp.readKey({ armoredKey: k.key });
          if (parsed.getKeys(keyId).length) return k.keyname || k.id;
        } catch {
          /* skip unreadable entry */
        }
      }
      return null;
    },
    [myPublicKeys, myPrivateKeys],
  );

  const signatureBanner = useCallback(
    async (signatures: openpgp.VerificationResult[]): Promise<Banner> => {
      if (!signatures.length) return banner("info", "Decrypted. The message carries no signature.");
      const sig = signatures[0];
      const who = await signerName(sig.keyID);
      try {
        await sig.verified;
        return banner(
          "ok",
          who ? `Valid signature from ${who}.` : "Valid signature from an unknown key.",
        );
      } catch {
        return banner(
          "warn",
          who
            ? `Decrypted, but the signature from ${who} is invalid.`
            : "Decrypted, but the signature is from a key you don't have — import it to verify.",
        );
      }
    },
    [signerName],
  );

  const handleDecrypt = async () => {
    setDecBusy(true);
    setSigStatus(null);
    setDecOutput("");
    try {
      const message = await openpgp.readMessage({ armoredMessage: decInput });
      // Decrypt with the chosen private key (or all of mine if none chosen).
      const { unlocked, locked } = await unlockPrivateKeys(decPass, decKeyId || undefined);
      if (!unlocked.length) {
        if (locked) {
          setNeedPass(true);
          setSigStatus(banner("warn", "Your secret key is protected — enter its passphrase below."));
        } else {
          setSigStatus(banner("err", "No usable private key. Generate or import one first."));
        }
        return;
      }
      // Verify against every public key I hold — no need to pick the author.
      const verificationKeys = (
        await Promise.all(
          myPublicKeys.map((k) => openpgp.readKey({ armoredKey: k.key }).catch(() => null)),
        )
      ).filter((k): k is openpgp.Key => k !== null);
      const result = await openpgp.decrypt({
        message,
        decryptionKeys: unlocked,
        verificationKeys: verificationKeys.length ? verificationKeys : undefined,
      });
      setDecOutput(result.data as string);
      setSigStatus(await signatureBanner(result.signatures));
    } catch (e) {
      setSigStatus(banner("err", e instanceof Error ? e.message : "Could not decrypt this message."));
    } finally {
      setDecBusy(false);
    }
  };

  const handleVerify = async () => {
    setDecBusy(true);
    setSigStatus(null);
    setDecOutput("");
    try {
      const verificationKeys = (
        await Promise.all(
          myPublicKeys.map((k) => openpgp.readKey({ armoredKey: k.key }).catch(() => null)),
        )
      ).filter((k): k is openpgp.Key => k !== null);
      if (!verificationKeys.length) {
        setSigStatus(banner("warn", "Import the sender's public key first to verify signatures."));
        return;
      }
      const cleartext = await openpgp.readCleartextMessage({ cleartextMessage: decInput });
      const result = await openpgp.verify({ message: cleartext, verificationKeys });
      setDecOutput(result.data as string);
      const sig = result.signatures[0];
      const who = await signerName(sig.keyID);
      try {
        await sig.verified;
        setSigStatus(banner("ok", who ? `Valid signature from ${who}.` : "Valid signature."));
      } catch {
        setSigStatus(banner("err", "Invalid signature — not signed by any key you hold."));
      }
    } catch (e) {
      setSigStatus(
        banner("err", e instanceof Error ? e.message : "Not a valid clear-signed message."),
      );
    } finally {
      setDecBusy(false);
    }
  };

  const signingEntry = myPrivateKeys[0];

  const handleEncrypt = async () => {
    setEncBusy(true);
    setEncOutput(null);
    try {
      const recipient = myPublicKeys.find((k) => k.id === encRecipient);
      if (!recipient) {
        toast("var(--amber)", "No recipient", "Import the recipient's public key first.");
        return;
      }
      const encryptionKeys = await openpgp.readKey({ armoredKey: recipient.key });
      const { unlocked } = await unlockPrivateKeys(decPass);
      const armored = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: encInput }),
        encryptionKeys,
        signingKeys: unlocked.length ? unlocked[0] : undefined,
      });
      setEncOutput({ label: "PGP Message", text: armored as string });
      if (!unlocked.length && signingEntry) {
        toast(
          "var(--amber)",
          "Encrypted without signature",
          "Your secret key is passphrase-protected; enter it on the Decrypt screen to sign.",
        );
      }
    } catch (e) {
      toast("var(--red)", "Encryption failed", e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setEncBusy(false);
    }
  };

  const handleSignOnly = async () => {
    setEncBusy(true);
    setEncOutput(null);
    try {
      const { unlocked, locked } = await unlockPrivateKeys(decPass);
      if (!unlocked.length) {
        toast(
          "var(--red)",
          "No signing key",
          locked
            ? "Your secret key is passphrase-protected; enter it on the Decrypt screen."
            : "Generate a private key first.",
        );
        return;
      }
      const armored = await openpgp.sign({
        message: await openpgp.createCleartextMessage({ text: encInput }),
        signingKeys: unlocked[0],
      });
      setEncOutput({ label: "Signed Message", text: armored as string });
    } catch (e) {
      toast("var(--red)", "Signing failed", e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setEncBusy(false);
    }
  };

  const handleGenerate = async () => {
    setGenBusy(true);
    try {
      const userIDs =
        genName || genEmail ? [{ name: genName || undefined, email: genEmail || undefined }] : [];
      const { privateKey } = await openpgp.generateKey({
        ...(genAlg === "RSA 4096"
          ? { type: "rsa" as const, rsaBits: 4096 }
          : { type: "ecc" as const, curve: "curve25519" as const }),
        userIDs,
        passphrase: genProtect && genPass ? genPass : undefined,
        format: "armored",
      });
      const stored = await importPrivateKey(genName || genEmail || "unamed", privateKey);
      setGenOpen(false);
      setGenName("");
      setGenEmail("");
      setGenPass("");
      goView("private");
      setSelected({ id: stored.id, kind: "private" });
      toast("var(--state-valid)", "Key pair generated", "Your new secret key is stored locally.");
    } catch (e) {
      toast("var(--red)", "Generation failed", e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setGenBusy(false);
    }
  };

  const openImport = (kind: "private" | "public") => {
    setImpKind(kind);
    setImpName("");
    setImpText("");
    setImpFile("");
    setImpOpen(true);
  };

  // Suggest a key name from the pasted/chosen armor, only while the user
  // hasn't typed one, so their own name is never overwritten.
  const suggestNameFrom = async (armored: string) => {
    try {
      const parsed = await openpgp.readKey({ armoredKey: armored.trim() });
      const userId = parsed.users[0]?.userID;
      return userId?.name || userId?.email || "";
    } catch {
      return "";
    }
  };

  const handleImport = async () => {
    setImpBusy(true);
    try {
      const armored = impText.trim();
      // Validate against the matching block type; readPrivateKey rejects a
      // public block, so a public key can't be filed under private keys.
      if (impKind === "private") await openpgp.readPrivateKey({ armoredKey: armored });
      else await openpgp.readKey({ armoredKey: armored });

      const name = impName.trim() || (await suggestNameFrom(armored)) || "unamed";
      const stored =
        impKind === "private"
          ? await importPrivateKey(name, armored)
          : await importPublicKey(name, armored);
      setImpOpen(false);
      setImpText("");
      setImpFile("");
      setImpName("");
      goView(impKind);
      setSelected({ id: stored.id, kind: impKind });
      toast(
        "var(--state-valid)",
        impKind === "private" ? "Private key imported" : "Certificate imported",
        `${name} was added to your ${impKind === "private" ? "private" : "public"} keys.`,
      );
    } catch (e) {
      toast("var(--red)", "Import failed", e instanceof Error ? e.message : "Not a valid key.");
    } finally {
      setImpBusy(false);
    }
  };

  const handleExportPublic = async (id: string, kind: "private" | "public") => {
    try {
      const entry =
        kind === "public"
          ? myPublicKeys.find((k) => k.id === id)
          : myPrivateKeys.find((k) => k.id === id);
      if (!entry) return;
      let armored = entry.key;
      if (kind === "private") {
        const pk = await openpgp.readPrivateKey({ armoredKey: entry.key });
        armored = pk.toPublic().armor();
      }
      download(`${entry.keyname || entry.id}-public.asc`, armored);
    } catch (e) {
      toast("var(--red)", "Export failed", e instanceof Error ? e.message : "Unknown error.");
    }
  };

  const handleBackup = (id: string) => {
    const entry = myPrivateKeys.find((k) => k.id === id);
    if (!entry) return;
    download(`${entry.keyname || entry.id}-SECRET.asc`, entry.key);
    toast("var(--amber)", "Secret key exported", "Store the backup somewhere safe and offline.");
  };

  const handleDelete = (id: string, kind: "private" | "public") => {
    const entry = (kind === "private" ? myPrivateKeys : myPublicKeys).find((k) => k.id === id);
    if (!entry) return;
    const label = entry.keyname || entry.id;
    if (
      !window.confirm(
        kind === "private"
          ? `Delete the SECRET key "${label}"? Messages encrypted to it become unreadable.`
          : `Delete the public key "${label}"?`,
      )
    )
      return;
    if (kind === "private") deletePrivateKey(id);
    else deletePublicKey(id);
    setSelected(null);
    toast("var(--red)", "Key deleted", `${label} was removed from local storage.`);
  };

  const openViewPublic = async (id: string, kind: "private" | "public") => {
    try {
      const entry = (kind === "private" ? myPrivateKeys : myPublicKeys).find((k) => k.id === id);
      if (!entry) return;
      let armored = entry.key;
      if (kind === "private") {
        const pk = await openpgp.readPrivateKey({ armoredKey: entry.key });
        armored = pk.toPublic().armor();
      }
      setViewKey({ name: entry.keyname || entry.id, armored });
    } catch (e) {
      toast("var(--red)", "Could not read key", e instanceof Error ? e.message : "Unknown error.");
    }
  };

  const openRename = (id: string, kind: "private" | "public") => {
    const entry = (kind === "private" ? myPrivateKeys : myPublicKeys).find((k) => k.id === id);
    setRenameValue(entry?.keyname || "");
    setRenameTarget({ id, kind });
  };

  const handleRename = () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) return;
    if (renameTarget.kind === "private") renamePrivateKey(renameTarget.id, name);
    else renamePublicKey(renameTarget.id, name);
    setRenameTarget(null);
    toast("var(--state-valid)", "Key renamed", `Now shown as “${name}”.`);
  };

  /* ── UI fragments ───────────────────────────────────────────────── */

  const monoCell: React.CSSProperties = {
    fontSize: "12px",
    letterSpacing: "var(--tracking-mono)",
    color: "var(--text-secondary)",
  };

  const navBtn = (v: View, icon: React.ReactNode, label: string, count?: number) => (
    <button
      className={`sigil-nav ${view === v ? "sigil-nav-active" : ""}`}
      onClick={() => {
        // A selection belongs to one list; drop it when leaving that list so
        // the details panel never shows a private key under the public list.
        if ((v === "private" || v === "public") && selected?.kind !== v) setSelected(null);
        goView(v);
      }}
    >
      <span
        className="flex-none inline-flex"
        style={{ color: view === v ? "var(--steel)" : "var(--text-muted)" }}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {mounted && count !== undefined && (
        <span className={mono.className} style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {count}
        </span>
      )}
    </button>
  );

  const screenHeader = (title: string, subtitle: string) => (
    <div className="flex flex-col gap-1">
      <span
        style={{
          fontSize: "19px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </span>
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{subtitle}</span>
    </div>
  );

  const statusBanner = (s: NonNullable<Banner>) => (
    <div
      className="flex items-center gap-2.5"
      style={{
        padding: "11px 14px",
        background: s.bg,
        border: `1px solid color-mix(in srgb, ${s.color} 35%, transparent)`,
        borderRadius: "var(--radius-md)",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "999px",
          background: s.color,
          flex: "none",
        }}
      />
      <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{s.text}</span>
    </div>
  );

  const tableHeader = (
    <div
      className="sigil-row"
      style={{ background: "var(--surface-panel)", height: "30px", position: "sticky", top: 0, zIndex: 1 }}
    >
      <span className="sigil-label px-3">Name</span>
      <span className="sigil-label px-3">Email</span>
      <span className="sigil-label px-3">Key ID</span>
      <span className="sigil-label px-3">Valid Until</span>
      <span className="sigil-label px-3">Status</span>
    </div>
  );

  const keyRow = (key: { id: string; keyname?: string }, kind: "private" | "public") => (
    <button
      key={key.id}
      className={`sigil-row sigil-row-click w-full ${
        selected?.id === key.id ? "sigil-row-selected" : ""
      }`}
      style={{ color: "var(--text-primary)" }}
      onClick={() => setSelected({ id: key.id, kind })}
      onContextMenu={(e) => {
        e.preventDefault();
        setSelected({ id: key.id, kind });
        setMenu({ id: key.id, kind, x: e.clientX, y: e.clientY });
      }}
    >
      <span
        className="flex items-center gap-2 min-w-0 px-3"
        style={kind === "private" ? { fontWeight: 600 } : undefined}
      >
        <KeyRound
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: kind === "private" ? "var(--state-ultimate)" : "var(--text-muted)" }}
        />
        <span className="truncate ph-mask">{key.keyname || key.id}</span>
      </span>
      <span className="px-3 truncate ph-mask" style={{ color: "var(--text-secondary)" }}>
        {meta[key.id]?.email ?? "—"}
      </span>
      <span className={`${mono.className} px-3 truncate ph-mask`} style={monoCell}>
        {meta[key.id]?.keyId ?? key.id.slice(0, 8).toUpperCase()}
      </span>
      <span className="px-3 truncate" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
        {meta[key.id]?.validUntil ?? "—"}
      </span>
      <span className="px-3">
        <span
          className={`sigil-badge ${kind === "private" ? "sigil-badge-ultimate" : "sigil-badge-valid"}`}
        >
          {kind === "private" ? "Ultimate" : "Valid"}
        </span>
      </span>
    </button>
  );

  const emptyMessage = (text: string) => (
    <div className="px-6 py-12 text-center" style={{ color: "var(--text-muted)", fontSize: "13px" }}>
      {text}
    </div>
  );

  const viewTitle: Record<View, string> = {
    private: "My Private Keys",
    public: "Public Keys",
    decrypt: "Decrypt / Verify",
    encrypt: "Encrypt / Sign",
    settings: "Settings",
  };

  // Full-width tappable key card for the mobile list.
  const mobileKeyCard = (key: { id: string; keyname?: string }, kind: "private" | "public") => (
    <button
      key={key.id}
      className="sigil-mobile-card"
      onClick={() => setSelected({ id: key.id, kind })}
      onContextMenu={(e) => {
        e.preventDefault();
        setSelected({ id: key.id, kind });
        setMenu({ id: key.id, kind, x: e.clientX, y: e.clientY });
      }}
    >
      <span
        className="inline-flex items-center justify-center flex-none"
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "var(--radius-md)",
          background: kind === "private" ? "var(--state-ultimate-subtle)" : "var(--accent-subtle)",
          color: kind === "private" ? "var(--state-ultimate)" : "var(--steel)",
        }}
      >
        <KeyRound className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0 flex flex-col" style={{ gap: "2px" }}>
        <span
          className="truncate ph-mask"
          style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}
        >
          {key.keyname || key.id}
        </span>
        <span className="truncate ph-mask" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {meta[key.id]?.email ?? meta[key.id]?.keyId ?? "—"}
        </span>
      </span>
      <span
        className={`sigil-badge flex-none ${kind === "private" ? "sigil-badge-ultimate" : "sigil-badge-valid"}`}
      >
        {kind === "private" ? "Ultimate" : "Valid"}
      </span>
      <ChevronRight className="w-4 h-4 flex-none" style={{ color: "var(--text-muted)" }} />
    </button>
  );

  const goKeys = (kind: "private" | "public") => {
    if (selected?.kind !== kind) setSelected(null);
    goView(kind);
  };

  const detailRow = (label: string, value: string, monospace = false) => (
    <>
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
      <span
        className={`ph-mask ${monospace ? mono.className : ""}`}
        style={monospace ? { ...monoCell, color: "var(--text-body)" } : { color: "var(--text-body)", fontSize: "13px" }}
      >
        {value}
      </span>
    </>
  );

  const selMeta = selectedKey ? meta[selectedKey.id] : undefined;

  // Empty-state hero (contains the SEO <h1>). Reused by the desktop details
  // panel and, on mobile, as the home screen when no key is selected.
  const emptyHero = (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="flex justify-center">
        <div className="sigil-well">
          <Shield className="w-9 h-9" strokeWidth={1.6} />
        </div>
      </div>
      <div className="space-y-1.5">
        <h1
          style={{
            fontSize: "19px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            color: "var(--text-primary)",
          }}
        >
          Select a key to get started
        </h1>
        <p style={{ fontSize: "13px", lineHeight: 1.45, color: "var(--text-secondary)" }}>
          Choose a key from the sidebar, or create a new one below.
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        <button className="sigil-btn sigil-btn-primary w-full" onClick={() => setGenOpen(true)}>
          <KeyRound className="w-4 h-4" />
          Create Private Key
          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
        </button>
        <button className="sigil-btn sigil-btn-secondary w-full" onClick={() => openImport("public")}>
          <Users className="w-4 h-4" />
          Import Public Key
        </button>
      </div>
    </div>
  );

  // Selected-key detail content. Reused by the desktop side panel and the
  // full-screen mobile sheet.
  const detailsBody = selectedKey && (
    <>
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border-hairline)", flex: "none" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="flex-1 min-w-0 truncate ph-mask"
                style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}
              >
                {selectedKey.keyname || selectedKey.id}
              </span>
              <span
                className={`sigil-badge ${
                  selectedKey.kind === "private" ? "sigil-badge-ultimate" : "sigil-badge-valid"
                }`}
              >
                {selectedKey.kind === "private" ? "Ultimate" : "Valid"}
              </span>
            </div>
            <div className="ph-mask" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {selMeta?.email ?? "—"}
            </div>
          </div>
          <div className="flex flex-col gap-3.5 flex-1 min-h-0 overflow-auto" style={{ padding: "16px" }}>
            {selMeta?.fingerprint && (
              <div className="flex flex-col gap-1.5">
                <span className="sigil-label">Fingerprint</span>
                <span
                  className={`ph-mask ${mono.className}`}
                  style={{ ...monoCell, color: "var(--text-body)", wordBreak: "break-word", lineHeight: 1.6 }}
                >
                  {groupFingerprint(selMeta.fingerprint)}
                </span>
              </div>
            )}
            <div
              className="grid gap-x-2.5 gap-y-2 items-baseline"
              style={{ gridTemplateColumns: "96px 1fr" }}
            >
              {detailRow("Key ID", selMeta?.keyId ?? "—", true)}
              {detailRow("Algorithm", selMeta?.algorithm ?? "—")}
              {detailRow("Created", selMeta?.created ?? "—")}
              {detailRow("Valid until", selMeta?.validUntil ?? "—")}
              {detailRow(
                "Trust",
                selectedKey.kind === "private" ? "Ultimate (this is your key)" : "Imported certificate",
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                className="sigil-btn sigil-btn-secondary"
                style={{ height: "24px", padding: "0 10px", fontSize: "12px" }}
                onClick={() => handleExportPublic(selectedKey.id, selectedKey.kind)}
              >
                Export Public Key
              </button>
              {selectedKey.kind === "private" && (
                <button
                  className="sigil-btn sigil-btn-secondary"
                  style={{ height: "24px", padding: "0 10px", fontSize: "12px" }}
                  onClick={() => handleBackup(selectedKey.id)}
                >
                  Back Up Secret Key
                </button>
              )}
              <button
                className="sigil-btn sigil-btn-danger"
                style={{ height: "24px", padding: "0 10px", fontSize: "12px" }}
                onClick={() => handleDelete(selectedKey.id, selectedKey.kind)}
              >
                Delete
              </button>
            </div>
            {selMeta?.publicArmor && (
              <div className="flex flex-col gap-2 flex-1 min-h-0">
                <div className="flex items-center">
                  <span className="sigil-label flex-1">Public Key</span>
                  <button
                    className="sigil-btn sigil-btn-ghost"
                    style={{ height: "22px", padding: "0 8px", fontSize: "11px" }}
                    onClick={() => {
                      navigator.clipboard.writeText(selMeta.publicArmor);
                      toast("var(--state-valid)", "Copied", "Public key copied to the clipboard.");
                    }}
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <textarea
                  readOnly
                  className={`sigil-textarea ${mono.className} flex-1 min-h-0`}
                  style={{
                    minHeight: "120px",
                    fontSize: "10px",
                    letterSpacing: "var(--tracking-mono)",
                    lineHeight: 1.55,
                    wordBreak: "break-all",
                  }}
                  value={selMeta.publicArmor}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>
            )}
          </div>
    </>
  );

  const detailsPanel = (
    <div
      className="flex flex-col"
      style={{
        width: "340px",
        flex: "none",
        borderLeft: "1px solid var(--border-hairline)",
        background: "var(--surface-panel)",
        overflow: "hidden",
      }}
    >
      {selectedKey ? (
        detailsBody
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ padding: "24px" }}>
          {emptyHero}
        </div>
      )}
    </div>
  );

  const fieldLabel = (text: string) => (
    <span className="sigil-label" style={{ display: "block", marginBottom: "6px" }}>
      {text}
    </span>
  );

  const dialog = (
    title: string,
    onClose: () => void,
    body: React.ReactNode,
    footer: React.ReactNode,
  ) => (
    <div className="sigil-dialog-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sigil-dialog ${archivo.className}`}>
        <div
          className="flex items-center"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-hairline)",
            background: "var(--metal-titlebar)",
            boxShadow: "var(--bevel-top)",
          }}
        >
          <span className="flex-1" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {title}
          </span>
          <button className="sigil-winbtn" onClick={onClose} aria-label="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div style={{ padding: "16px" }}>{body}</div>
        <div
          className="flex justify-end gap-2"
          style={{ padding: "12px 16px", borderTop: "1px solid var(--border-hairline)" }}
        >
          {footer}
        </div>
      </div>
    </div>
  );

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div
      className={`${archivo.className} sigil flex flex-col`}
      style={{
        height: "100%",
        minWidth: isMobile ? undefined : "1024px",
        background: "var(--surface-app)",
        color: "var(--text-body)",
      }}
    >
      {/* ── Titlebar ── */}
      <div className="sigil-titlebar">
        <span className="flex items-center gap-2">
          <Image
            src="/kleopatra-logo.png"
            alt="Kleopatra logo"
            width={22}
            height={22}
            priority
            style={{ display: "block", flex: "none" }}
          />
          <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-primary)" }}>
            KLEOPATRA
          </span>
        </span>
        <span className="sigil-chip">NEO</span>
        {isMobile ? (
          <>
            <span className="flex-1" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
              {viewTitle[view]}
            </span>
          </>
        ) : (
          <>
            <span style={{ width: "1px", height: "14px", background: "var(--border-strong)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sigil Key Manager</span>
            <span className="flex-1" />
            <div className="flex gap-0.5" aria-hidden="true">
              <span className="sigil-winbtn">
                <Minus className="w-3 h-3" />
              </span>
              <span className="sigil-winbtn">
                <Square className="w-2.5 h-2.5" />
              </span>
              <span className="sigil-winbtn">
                <X className="w-3.5 h-3.5" />
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar (desktop) ── */}
        <nav
          className="flex flex-col gap-0.5"
          style={{
            display: isMobile ? "none" : "flex",
            width: "216px",
            flex: "none",
            background: "var(--surface-panel)",
            borderRight: "1px solid var(--border-hairline)",
            padding: "12px 8px",
          }}
        >
          <div className="sigil-label" style={{ padding: "0 10px 8px" }}>
            Keys
          </div>
          {navBtn("private", <KeyRound className="w-[15px] h-[15px]" />, "My Private Keys", myPrivateKeys.length)}
          {navBtn("public", <Users className="w-[15px] h-[15px]" />, "Public Keys", myPublicKeys.length)}

          <div className="sigil-label" style={{ padding: "14px 10px 8px" }}>
            Tools
          </div>
          {navBtn("decrypt", <LockKeyhole className="w-[15px] h-[15px]" />, "Decrypt / Verify")}
          {navBtn("encrypt", <Lock className="w-[15px] h-[15px]" />, "Encrypt / Sign")}

          <div className="sigil-label" style={{ padding: "14px 10px 8px" }}>
            Application
          </div>
          {navBtn("settings", <SlidersHorizontal className="w-[15px] h-[15px]" />, "Settings")}

          <div className="sigil-label" style={{ padding: "14px 10px 8px" }}>
            Support
          </div>
          <Link href="/tools" className="sigil-nav" style={{ color: "var(--text-secondary)" }}>
            <span className="flex-none inline-flex" style={{ color: "var(--text-muted)" }}>
              <Wrench className="w-[15px] h-[15px]" />
            </span>
            <span className="flex-1">PGP Tools & Guides</span>
          </Link>
          <a
            href="https://discord.gg/mbYdvN8hZk"
            target="_blank"
            rel="noopener noreferrer"
            className="sigil-nav"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="flex-none inline-flex" style={{ color: "var(--text-muted)" }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.369a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.291.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </span>
            <span className="flex-1">Discord</span>
          </a>

          {/* Misc links are web-only — hidden in the desktop app */}
          {!isDesktopApp && (
            <>
              <div className="sigil-label" style={{ padding: "14px 10px 8px" }}>
                Misc
              </div>
              <a
                href="https://irc-server.org"
                target="_blank"
                rel="noopener noreferrer"
                className="sigil-nav"
                style={{ color: "var(--text-secondary)" }}
              >
                <span className="flex-none inline-flex" style={{ color: "var(--text-muted)" }}>
                  <Hash className="w-[15px] h-[15px]" />
                </span>
                <span className="flex-1">irc-server.org</span>
              </a>
              <a
                href="https://discordpgp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="sigil-nav"
                style={{ color: "var(--text-secondary)" }}
              >
                <span className="flex-none inline-flex" style={{ color: "var(--text-muted)" }}>
                  <Globe className="w-[15px] h-[15px]" />
                </span>
                <span className="flex-1">discordpgp.com</span>
              </a>
            </>
          )}

          {/* Bottom card: web → download the desktop app · desktop → online sync */}
          {mounted &&
            (isDesktopApp ? (
              <div
                className="sigil-card"
                style={{ marginTop: "auto", padding: "12px", textAlign: "center" }}
              >
                <div className="flex items-center justify-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  {syncToken && syncStatus !== "error" ? (
                    <Cloud style={{ width: "16px", height: "16px", color: "var(--state-valid)" }} />
                  ) : (
                    <CloudOff style={{ width: "16px", height: "16px", color: "var(--text-muted)" }} />
                  )}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginTop: "8px" }}>
                  Online Sync
                </div>
                <div
                  className="ph-mask"
                  style={{ fontSize: "11px", color: "var(--text-muted)", margin: "3px 0 10px" }}
                >
                  {syncToken
                    ? syncEmail
                    : "Back up your keys, end-to-end encrypted."}
                </div>
                <button
                  className="sigil-btn sigil-btn-primary w-full"
                  style={{ height: "28px", justifyContent: "center" }}
                  onClick={() => setSyncModalOpen(true)}
                >
                  {syncToken ? (
                    <>
                      <Cloud className="w-3.5 h-3.5" />
                      Manage Account
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      Sign in / Create account
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div
                className="sigil-card"
                style={{ marginTop: "auto", padding: "12px", textAlign: "center" }}
              >
                <div className="flex items-center justify-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <AppleLogo style={{ width: "16px", height: "16px" }} />
                  <WindowsLogo style={{ width: "15px", height: "15px" }} />
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginTop: "8px" }}>
                  Kleopatra Desktop
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", margin: "3px 0 10px" }}>
                  Native app for macOS &amp; Windows, with the same encrypted sync.
                </div>
                <a
                  href={desktopDownloadUrl()}
                  className="sigil-btn sigil-btn-primary w-full"
                  style={{ height: "28px", justifyContent: "center" }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            ))}
        </nav>

        {/* ── My Private Keys / Public Keys ── */}
        {(view === "private" || view === "public") && (
          <>
            <div className="flex-1 min-w-0 flex flex-col">
              {isMobile ? (
                /* Mobile: segmented Private/Public + full-width search */
                <div
                  className="flex flex-col gap-2.5"
                  style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-hairline)", flex: "none" }}
                >
                  <div className="sigil-seg">
                    <button
                      className={view === "private" ? "active" : ""}
                      onClick={() => goKeys("private")}
                    >
                      Private {mounted ? `(${myPrivateKeys.length})` : ""}
                    </button>
                    <button
                      className={view === "public" ? "active" : ""}
                      onClick={() => goKeys("public")}
                    >
                      Public {mounted ? `(${myPublicKeys.length})` : ""}
                    </button>
                  </div>
                  <span className="sigil-search" style={{ height: "38px" }}>
                    <Search className="w-4 h-4 flex-none" style={{ color: "var(--text-muted)" }} />
                    <input
                      placeholder="Search keys"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2"
                  style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-hairline)", flex: "none" }}
                >
                  {view === "private" ? (
                    <button
                      className="sigil-btn sigil-btn-primary"
                      style={{ height: "28px" }}
                      onClick={() => setGenOpen(true)}
                    >
                      Generate Key Pair
                    </button>
                  ) : null}
                  <button
                    className="sigil-btn sigil-btn-secondary"
                    style={{ height: "28px" }}
                    onClick={() => openImport(view === "private" ? "private" : "public")}
                  >
                    Import
                  </button>
                  <span className="flex-1" />
                  <span className="sigil-search" style={{ flex: "0 1 280px", minWidth: "150px" }}>
                    <Search className="w-3.5 h-3.5 flex-none" style={{ color: "var(--text-muted)" }} />
                    <input
                      placeholder="Search by name, email, or key ID"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </span>
                </div>
              )}

              <div
                className="flex-1 min-h-0 overflow-auto"
                style={{ paddingBottom: isMobile ? "72px" : undefined }}
              >
                {!isMobile && tableHeader}
                {mounted &&
                  view === "private" &&
                  (visiblePrivateKeys.length
                    ? visiblePrivateKeys.map((k) => (isMobile ? mobileKeyCard(k, "private") : keyRow(k, "private")))
                    : emptyMessage(
                        myPrivateKeys.length
                          ? "No keys match. Clear the search."
                          : "No private keys yet. Generate your first key pair.",
                      ))}
                {mounted &&
                  view === "public" &&
                  (visiblePublicKeys.length
                    ? visiblePublicKeys.map((k) => (isMobile ? mobileKeyCard(k, "public") : keyRow(k, "public")))
                    : emptyMessage(
                        myPublicKeys.length
                          ? "No certificates match. Clear the search, or import one."
                          : "No public keys imported yet.",
                      ))}
              </div>
            </div>
            {!isMobile && detailsPanel}
          </>
        )}

        {/* ── Decrypt / Verify ── */}
        {view === "decrypt" && (
          <div className={`flex-1 min-w-0 ${isMobile ? "overflow-auto" : "overflow-hidden"}`}>
            <div
              className="flex flex-col gap-3.5"
              style={{
                padding: isMobile ? "16px 14px 88px" : "22px 26px 24px",
                height: isMobile ? "auto" : "100%",
                boxSizing: "border-box",
              }}
            >
              {screenHeader("Decrypt / Verify", "Paste an armored message. It is decrypted with your private key.")}
              <div className="flex items-end gap-2.5 flex-wrap">
                <div style={{ width: "300px" }}>
                  {fieldLabel("Decrypt With Key")}
                  <select
                    className="sigil-select"
                    value={decKeyId}
                    onChange={(e) => setDecKeyId(e.target.value)}
                  >
                    <option value="">Any of my private keys</option>
                    {myPrivateKeys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.keyname || k.id}
                      </option>
                    ))}
                  </select>
                </div>
                {needPass && (
                  <div style={{ width: "260px" }}>
                    {fieldLabel("Secret Key Passphrase")}
                    <input
                      type="password"
                      className="sigil-input"
                      value={decPass}
                      onChange={(e) => setDecPass(e.target.value)}
                      placeholder="Enter your passphrase"
                    />
                  </div>
                )}
                <span style={{ fontSize: "12px", color: "var(--text-muted)", paddingBottom: "7px" }}>
                  The signature is verified automatically against your public keys.
                </span>
              </div>

              {/* Input | Output — side by side on desktop, stacked on mobile */}
              <div className={isMobile ? "flex flex-col gap-3" : "flex gap-4 flex-1 min-h-0"}>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <span className="sigil-label">Encrypted Input</span>
                  <textarea
                    className={`sigil-textarea ${mono.className} ${isMobile ? "" : "flex-1 min-h-0"}`}
                    style={{ fontSize: "12px", letterSpacing: "var(--tracking-mono)", ...(isMobile ? { height: "190px" } : {}) }}
                    placeholder={"-----BEGIN PGP MESSAGE-----\nPaste the armored message here."}
                    spellCheck={false}
                    value={decInput}
                    onChange={(e) => setDecInput(e.target.value)}
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <span className="sigil-label">Decrypted Message</span>
                  <div
                    className={`sigil-card ${isMobile ? "" : "flex-1 min-h-0"} flex flex-col`}
                    style={isMobile ? { minHeight: "170px" } : undefined}
                  >
                    {sigStatus && (
                      <div
                        className="flex items-center gap-2.5"
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--border-hairline)",
                          background: sigStatus.bg,
                        }}
                      >
                        <span
                          style={{ width: "7px", height: "7px", borderRadius: "999px", background: sigStatus.color, flex: "none" }}
                        />
                        <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{sigStatus.text}</span>
                      </div>
                    )}
                    <div
                      className={`flex-1 min-h-0 overflow-auto ${decOutput ? "ph-mask" : ""}`}
                      style={{
                        padding: "14px",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        color: decOutput ? "var(--text-body)" : "var(--text-muted)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {decOutput || "The decrypted message will appear here."}
                    </div>
                    {decOutput && (
                      <div
                        className="flex justify-end"
                        style={{ padding: "8px 12px", borderTop: "1px solid var(--border-hairline)" }}
                      >
                        <button
                          className="sigil-btn sigil-btn-ghost"
                          style={{ height: "24px", padding: "0 10px", fontSize: "12px" }}
                          onClick={() => {
                            navigator.clipboard.writeText(decOutput);
                            toast("var(--state-valid)", "Copied", "Decrypted message copied.");
                          }}
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions — full width beneath both panes */}
              <div className="flex items-center gap-2">
                <button
                  className="sigil-btn sigil-btn-primary"
                  style={{ height: "28px" }}
                  disabled={decBusy || !decInput.trim()}
                  onClick={handleDecrypt}
                >
                  {decBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Decrypt
                </button>
                <button
                  className="sigil-btn sigil-btn-secondary"
                  style={{ height: "28px" }}
                  disabled={decBusy || !decInput.trim()}
                  onClick={handleVerify}
                >
                  Verify Signature
                </button>
                <span className="flex-1" />
                <button
                  className="sigil-btn sigil-btn-ghost"
                  style={{ height: "28px" }}
                  onClick={() => {
                    setDecInput("");
                    setDecOutput("");
                    setSigStatus(null);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Encrypt / Sign ── */}
        {view === "encrypt" && (
          <div className={`flex-1 min-w-0 ${isMobile ? "overflow-auto" : "overflow-hidden"}`}>
            <div
              className="flex flex-col gap-3.5"
              style={{
                padding: isMobile ? "16px 14px 88px" : "22px 26px 24px",
                height: isMobile ? "auto" : "100%",
                boxSizing: "border-box",
              }}
            >
              {screenHeader(
                "Encrypt / Sign",
                "Write a message, choose the recipient's public key, then encrypt or sign.",
              )}
              <div className="flex items-end gap-2.5 flex-wrap">
                <div style={{ width: "300px" }}>
                  {fieldLabel("Encrypt For")}
                  <select
                    className="sigil-select"
                    value={encRecipient}
                    onChange={(e) => setEncRecipient(e.target.value)}
                  >
                    <option value="">Select a recipient…</option>
                    {myPublicKeys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.keyname || k.id}
                      </option>
                    ))}
                  </select>
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", paddingBottom: "7px" }}>
                  {mounted && signingEntry ? (
                    <>
                      Signatures are made with your key{" "}
                      <span className="ph-mask">{meta[signingEntry.id]?.keyId ?? ""}</span>.
                    </>
                  ) : (
                    "No private key yet — messages are encrypted without a signature."
                  )}
                </span>
              </div>

              {/* Message | Output — side by side on desktop, stacked on mobile */}
              <div className={isMobile ? "flex flex-col gap-3" : "flex gap-4 flex-1 min-h-0"}>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <span className="sigil-label">Message</span>
                  <textarea
                    className={`sigil-textarea ${mono.className} ${isMobile ? "" : "flex-1 min-h-0"}`}
                    style={{ fontSize: "12px", letterSpacing: "var(--tracking-mono)", ...(isMobile ? { height: "190px" } : {}) }}
                    placeholder="Write the message to encrypt or sign."
                    spellCheck={false}
                    value={encInput}
                    onChange={(e) => setEncInput(e.target.value)}
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <span className="sigil-label">{encOutput?.label ?? "Output"}</span>
                  <div
                    className={`sigil-card ${isMobile ? "" : "flex-1 min-h-0"} flex flex-col`}
                    style={isMobile ? { minHeight: "170px" } : undefined}
                  >
                    <div
                      className={`flex-1 min-h-0 overflow-auto ${encOutput ? `ph-mask ${mono.className}` : ""}`}
                      style={{
                        padding: "14px",
                        fontSize: encOutput ? "11px" : "13px",
                        letterSpacing: encOutput ? "var(--tracking-mono)" : undefined,
                        lineHeight: 1.65,
                        color: encOutput ? "var(--text-body)" : "var(--text-muted)",
                        whiteSpace: "pre-wrap",
                        wordBreak: encOutput ? "break-all" : "break-word",
                      }}
                    >
                      {encOutput?.text || "The encrypted or signed output will appear here."}
                    </div>
                    {encOutput && (
                      <div
                        className="flex justify-end"
                        style={{ padding: "8px 12px", borderTop: "1px solid var(--border-hairline)" }}
                      >
                        <button
                          className="sigil-btn sigil-btn-ghost"
                          style={{ height: "24px", padding: "0 10px", fontSize: "12px" }}
                          onClick={() => {
                            navigator.clipboard.writeText(encOutput.text);
                            toast("var(--state-valid)", "Copied", `${encOutput.label} copied.`);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions — full width beneath both panes */}
              <div className="flex items-center gap-2">
                <button
                  className="sigil-btn sigil-btn-primary"
                  style={{ height: "28px" }}
                  disabled={encBusy || !encInput.trim() || !encRecipient}
                  onClick={handleEncrypt}
                >
                  {encBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Encrypt
                </button>
                <button
                  className="sigil-btn sigil-btn-secondary"
                  style={{ height: "28px" }}
                  disabled={encBusy || !encInput.trim()}
                  onClick={handleSignOnly}
                >
                  Sign Only
                </button>
                <span className="flex-1" />
                <button
                  className="sigil-btn sigil-btn-ghost"
                  style={{ height: "28px" }}
                  onClick={() => {
                    setEncInput("");
                    setEncOutput(null);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {view === "settings" && (
          <div className="flex-1 min-w-0 overflow-auto">
            <div
              className="flex flex-col gap-4"
              style={{ padding: isMobile ? "16px 14px 88px" : "22px 26px 28px", maxWidth: "640px" }}
            >
              {screenHeader("Settings", "Application preferences. Changes apply immediately.")}
              <div className="sigil-card">
                <div
                  className="sigil-label"
                  style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-hairline)" }}
                >
                  Theme
                </div>
                <div className="grid grid-cols-2 gap-2.5" style={{ padding: "16px" }}>
                  <button
                    className={`sigil-theme-card ${theme === "light" ? "sigil-theme-card-active" : ""}`}
                    onClick={() => theme !== "light" && toggle()}
                  >
                    <span
                      style={{
                        display: "block",
                        height: "44px",
                        borderRadius: "var(--radius-sm)",
                        background: "linear-gradient(180deg, #f3f5f7 0%, #e1e5ea 100%)",
                        border: "1px solid rgba(25,35,50,0.14)",
                      }}
                    />
                    <span className="flex flex-col">
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Light</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Brushed aluminum</span>
                    </span>
                  </button>
                  <button
                    className={`sigil-theme-card ${theme === "dark" ? "sigil-theme-card-active" : ""}`}
                    onClick={() => theme !== "dark" && toggle()}
                  >
                    <span
                      style={{
                        display: "block",
                        height: "44px",
                        borderRadius: "var(--radius-sm)",
                        background: "linear-gradient(180deg, #2b313a 0%, #1c2128 100%)",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    />
                    <span className="flex flex-col">
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Dark</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Graphite</span>
                    </span>
                  </button>
                </div>
              </div>
              <div className="sigil-card">
                <div
                  className="sigil-label"
                  style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-hairline)" }}
                >
                  Online Sync
                </div>
                <div className="flex items-center gap-3 flex-wrap" style={{ padding: "16px" }}>
                  <div className="flex-1 min-w-0" style={{ fontSize: "13px", color: "var(--text-body)" }}>
                    {mounted && syncToken ? (
                      <>
                        <span className="ph-mask" style={{ fontWeight: 500 }}>{syncEmail}</span>
                        <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)" }}>
                          {syncStatus === "syncing"
                            ? "Syncing…"
                            : syncStatus === "error"
                              ? "Sync error — open account settings"
                              : syncLastAt
                                ? `End-to-end encrypted · synced ${new Date(syncLastAt).toLocaleString()}`
                                : "End-to-end encrypted"}
                        </span>
                      </>
                    ) : (
                      <>
                        Not enabled
                        <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)" }}>
                          Back up your keys to the cloud, encrypted with AES-256 on this device.
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    className="sigil-btn sigil-btn-secondary"
                    style={{ height: "28px" }}
                    onClick={() => setSyncModalOpen(true)}
                  >
                    {mounted && syncToken ? "Manage Account" : "Enable Sync"}
                  </button>
                </div>
              </div>
              <div className="sigil-card">
                <div
                  className="sigil-label"
                  style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-hairline)" }}
                >
                  Storage
                </div>
                <div
                  className="grid gap-2"
                  style={{ padding: "16px", gridTemplateColumns: "110px 1fr", fontSize: "13px" }}
                >
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Keys</span>
                  <span className={mono.className} style={monoCell}>
                    browser localStorage — local only
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Engine</span>
                  <span style={{ color: "var(--text-body)" }}>OpenPGP.js</span>
                </div>
              </div>

              {/* Links (mobile only — these live in the sidebar on desktop) */}
              {isMobile && (
                <div className="sigil-card">
                  <div
                    className="sigil-label"
                    style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-hairline)" }}
                  >
                    More
                  </div>
                  <div className="flex flex-col">
                    {[
                      { href: "/tools", label: "PGP Tools & Guides", icon: <Wrench className="w-[18px] h-[18px]" />, external: false },
                      { href: "https://discord.gg/mbYdvN8hZk", label: "Discord", icon: <Globe className="w-[18px] h-[18px]" />, external: true },
                      { href: "https://irc-server.org", label: "irc-server.org", icon: <Hash className="w-[18px] h-[18px]" />, external: true },
                      { href: "https://discordpgp.com", label: "discordpgp.com", icon: <Globe className="w-[18px] h-[18px]" />, external: true },
                      { href: "https://github.com/nicobytes/kleopatra", label: "Open source on GitHub", icon: <Github className="w-[18px] h-[18px]" />, external: true },
                    ].map((item, i) =>
                      item.external ? (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3"
                          style={{ padding: "13px 16px", borderTop: i ? "1px solid var(--border-hairline)" : undefined, color: "var(--text-body)", fontSize: "15px" }}
                        >
                          <span className="flex-none" style={{ color: "var(--text-muted)" }}>{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className="w-4 h-4 flex-none" style={{ color: "var(--text-muted)" }} />
                        </a>
                      ) : (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-center gap-3"
                          style={{ padding: "13px 16px", borderTop: i ? "1px solid var(--border-hairline)" : undefined, color: "var(--text-body)", fontSize: "15px" }}
                        >
                          <span className="flex-none" style={{ color: "var(--text-muted)" }}>{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className="w-4 h-4 flex-none" style={{ color: "var(--text-muted)" }} />
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Status bar (desktop) ── */}
      {!isMobile && (
        <div
          className={`${mono.className} flex items-center gap-2.5 px-3.5`}
          style={{
            height: "26px",
            flex: "none",
            background: "var(--surface-panel)",
            borderTop: "1px solid var(--border-hairline)",
            fontSize: "11px",
            letterSpacing: "var(--tracking-mono)",
            color: "var(--text-muted)",
          }}
        >
          {mounted && (
            <>
              <span>{myPublicKeys.length} public keys</span>
              <span>·</span>
              <span>{myPrivateKeys.length} private keys</span>
            </>
          )}
          <span className="flex-1" />
          <button
            onClick={() => setSyncModalOpen(true)}
            className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", color: "inherit", letterSpacing: "inherit" }}
          >
            {!mounted ? null : !isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                <span>Offline</span>
              </>
            ) : !syncToken ? (
              <>
                <CloudOff className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                <span>Remote sync off</span>
              </>
            ) : syncStatus === "syncing" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--steel)" }} />
                <span>Syncing…</span>
              </>
            ) : syncStatus === "error" ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--amber)" }} />
                <span>Sync error</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" style={{ color: "var(--state-valid)" }} />
                <span>Sync on · end-to-end encrypted</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Mobile: primary-action FAB (Generate for private, Import for public) ── */}
      {isMobile && (view === "private" || view === "public") && (
        <button
          className="sigil-mobile-fab"
          aria-label={view === "private" ? "Generate key pair" : "Import public key"}
          onClick={() => (view === "private" ? setGenOpen(true) : openImport("public"))}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ── Mobile: full-screen key detail sheet ── */}
      {isMobile && selectedKey && (
        <div className={`sigil-sheet ${archivo.className}`}>
          <div className="sigil-titlebar" style={{ gap: "6px" }}>
            <button
              className="sigil-winbtn"
              style={{ width: "34px", height: "34px" }}
              aria-label="Back"
              onClick={() => setSelected(null)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
              {selectedKey.kind === "private" ? "Private Key" : "Public Key"}
            </span>
            <span className="flex-1" />
            <button
              className="sigil-winbtn"
              style={{ width: "34px", height: "34px" }}
              aria-label="More actions"
              onClick={() => setMenu({ id: selectedKey.id, kind: selectedKey.kind, x: window.innerWidth, y: 46 })}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            {detailsBody}
          </div>
        </div>
      )}

      {/* ── Mobile: bottom tab bar ── */}
      {isMobile && (
        <nav className="sigil-bottomnav">
          <button className={view === "private" || view === "public" ? "active" : ""} onClick={() => goKeys(view === "public" ? "public" : "private")}>
            <KeyRound className="w-[22px] h-[22px]" strokeWidth={view === "private" || view === "public" ? 2.2 : 1.8} />
            Keys
          </button>
          <button className={view === "decrypt" ? "active" : ""} onClick={() => goView("decrypt")}>
            <LockKeyhole className="w-[22px] h-[22px]" strokeWidth={view === "decrypt" ? 2.2 : 1.8} />
            Decrypt
          </button>
          <button className={view === "encrypt" ? "active" : ""} onClick={() => goView("encrypt")}>
            <Lock className="w-[22px] h-[22px]" strokeWidth={view === "encrypt" ? 2.2 : 1.8} />
            Encrypt
          </button>
          <button className={view === "settings" ? "active" : ""} onClick={() => goView("settings")}>
            <SlidersHorizontal className="w-[22px] h-[22px]" strokeWidth={view === "settings" ? 2.2 : 1.8} />
            Settings
          </button>
        </nav>
      )}

      {/* ── Generate Key Pair dialog ── */}
      {genOpen &&
        dialog(
          "Generate Key Pair",
          () => !genBusy && setGenOpen(false),
          <div className="flex flex-col gap-3.5">
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Your key pair identifies you when signing and lets others encrypt to you.
            </div>
            <div>
              {fieldLabel("Name")}
              <input
                className="sigil-input"
                placeholder="Ada Lovelace"
                value={genName}
                onChange={(e) => setGenName(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Shown in your user ID</span>
            </div>
            <div>
              {fieldLabel("Email")}
              <input
                type="email"
                className="sigil-input"
                placeholder="ada@corp.example"
                value={genEmail}
                onChange={(e) => setGenEmail(e.target.value)}
              />
            </div>
            <div>
              {fieldLabel("Algorithm")}
              <select className="sigil-select" value={genAlg} onChange={(e) => setGenAlg(e.target.value)}>
                {GEN_ALGS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2" style={{ fontSize: "13px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={genProtect}
                onChange={(e) => setGenProtect(e.target.checked)}
              />
              Protect the secret key with a passphrase
            </label>
            {genProtect && (
              <div>
                {fieldLabel("Passphrase")}
                <input
                  type="password"
                  className="sigil-input"
                  value={genPass}
                  onChange={(e) => setGenPass(e.target.value)}
                />
              </div>
            )}
          </div>,
          <>
            <button
              className="sigil-btn sigil-btn-ghost"
              style={{ height: "28px" }}
              disabled={genBusy}
              onClick={() => setGenOpen(false)}
            >
              Cancel
            </button>
            <button
              className="sigil-btn sigil-btn-primary"
              style={{ height: "28px" }}
              disabled={genBusy || (genProtect && !genPass)}
              onClick={handleGenerate}
            >
              {genBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {genBusy ? "Generating…" : "Generate"}
            </button>
          </>,
        )}

      {/* ── Import dialog (public certificate or secret key) ── */}
      {impOpen &&
        dialog(
          impKind === "private" ? "Import Secret Key" : "Import Certificate",
          () => !impBusy && setImpOpen(false),
          <div className="flex flex-col gap-3">
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {impKind === "private"
                ? "Paste an armored secret key, or choose any file containing it."
                : "Paste an armored certificate, or choose any file containing it."}
            </div>
            <div>
              {fieldLabel("Key Name")}
              <input
                className="sigil-input"
                placeholder="A label to recognise this key"
                value={impName}
                onChange={(e) => setImpName(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Shown in your key list. Left blank, the key&rsquo;s own user ID is used.
              </span>
            </div>
            <textarea
              className={`sigil-textarea ${mono.className}`}
              style={{ height: "150px", fontSize: "11px", letterSpacing: "var(--tracking-mono)" }}
              placeholder={
                impKind === "private"
                  ? "-----BEGIN PGP PRIVATE KEY BLOCK-----\nPaste the ASCII armor here."
                  : "-----BEGIN PGP PUBLIC KEY BLOCK-----\nPaste the ASCII armor here."
              }
              spellCheck={false}
              value={impText}
              onChange={(e) => setImpText(e.target.value)}
            />
            <div className="flex items-center gap-2.5">
              <span className="flex-1" style={{ height: "1px", background: "var(--border-hairline)" }} />
              <span className="sigil-label">Or</span>
              <span className="flex-1" style={{ height: "1px", background: "var(--border-hairline)" }} />
            </div>
            <div className="flex items-center gap-2.5">
              <label
                className="sigil-btn sigil-btn-secondary"
                style={{ height: "28px", whiteSpace: "nowrap" }}
              >
                <FileText className="w-3.5 h-3.5" />
                Choose File
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImpFile(file.name);
                    file.text().then(setImpText);
                  }}
                />
              </label>
              <span className={`${mono.className} truncate`} style={{ ...monoCell }}>
                {impFile || "No file selected"}
              </span>
            </div>
          </div>,
          <>
            <button
              className="sigil-btn sigil-btn-ghost"
              style={{ height: "28px" }}
              disabled={impBusy}
              onClick={() => setImpOpen(false)}
            >
              Cancel
            </button>
            <button
              className="sigil-btn sigil-btn-primary"
              style={{ height: "28px" }}
              disabled={impBusy || !impText.trim()}
              onClick={handleImport}
            >
              {impBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Import
            </button>
          </>,
        )}

      {/* ── Row context menu ── */}
      {menu && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 199 }} onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
          <div
            className={`sigil-menu ${archivo.className}`}
            style={{
              left: Math.min(menu.x, (typeof window !== "undefined" ? window.innerWidth : 9999) - 210),
              top: Math.min(menu.y, (typeof window !== "undefined" ? window.innerHeight : 9999) - 220),
            }}
          >
            <button className="sigil-menu-item" onClick={() => { openViewPublic(menu.id, menu.kind); setMenu(null); }}>
              <Eye className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              View Public Key
            </button>
            <button className="sigil-menu-item" onClick={() => { handleExportPublic(menu.id, menu.kind); setMenu(null); }}>
              <Download className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              {menu.kind === "private" ? "Export Public Key" : "Export"}
            </button>
            {menu.kind === "private" && (
              <button className="sigil-menu-item" onClick={() => { handleBackup(menu.id); setMenu(null); }}>
                <Download className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                Back Up Secret Key
              </button>
            )}
            <button className="sigil-menu-item" onClick={() => { openRename(menu.id, menu.kind); setMenu(null); }}>
              <Pencil className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              Rename
            </button>
            <div className="sigil-menu-sep" />
            <button className="sigil-menu-item sigil-menu-item-danger" onClick={() => { handleDelete(menu.id, menu.kind); setMenu(null); }}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* ── Rename dialog ── */}
      {renameTarget &&
        dialog(
          renameTarget.kind === "private" ? "Rename Private Key" : "Rename Public Key",
          () => setRenameTarget(null),
          <div className="flex flex-col gap-3">
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              This changes only the label shown in your key list. The key itself is unchanged.
            </div>
            <div>
              {fieldLabel("Key Name")}
              <input
                className="sigil-input"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
            </div>
          </div>,
          <>
            <button className="sigil-btn sigil-btn-ghost" style={{ height: "28px" }} onClick={() => setRenameTarget(null)}>
              Cancel
            </button>
            <button
              className="sigil-btn sigil-btn-primary"
              style={{ height: "28px" }}
              disabled={!renameValue.trim()}
              onClick={handleRename}
            >
              Rename
            </button>
          </>,
        )}

      {/* ── View Public Key dialog ── */}
      {viewKey &&
        dialog(
          "Public Key",
          () => setViewKey(null),
          <div className="flex flex-col gap-3">
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Armored public key for <strong style={{ color: "var(--text-primary)" }}>{viewKey.name}</strong>. Safe to share.
            </div>
            <div
              className={`ph-mask ${mono.className}`}
              style={{
                padding: "12px",
                background: "var(--surface-input)",
                border: "1px solid var(--border-input)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--inset-well)",
                fontSize: "11px",
                letterSpacing: "var(--tracking-mono)",
                lineHeight: 1.6,
                color: "var(--text-body)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              {viewKey.armored}
            </div>
          </div>,
          <>
            <button className="sigil-btn sigil-btn-ghost" style={{ height: "28px" }} onClick={() => setViewKey(null)}>
              Close
            </button>
            <button
              className="sigil-btn sigil-btn-primary"
              style={{ height: "28px" }}
              onClick={() => {
                navigator.clipboard.writeText(viewKey.armored);
                toast("var(--state-valid)", "Copied", "Public key copied to the clipboard.");
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
          </>,
        )}

      {/* ── Toasts ── */}
      <div
        className="fixed flex flex-col gap-2"
        style={
          isMobile
            ? { left: "12px", right: "12px", bottom: "calc(66px + env(safe-area-inset-bottom, 0px))", zIndex: 300 }
            : { right: "14px", bottom: "38px", zIndex: 300 }
        }
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="sigil-card flex items-start gap-2.5"
            style={{ width: "320px", padding: "11px 13px", boxShadow: "var(--shadow-dialog), var(--bevel-top)" }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "999px",
                background: t.color,
                flex: "none",
                marginTop: "5px",
              }}
            />
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{t.title}</span>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{t.desc}</span>
            </div>
            <button
              className="sigil-winbtn"
              style={{ width: "20px", height: "20px" }}
              aria-label="Dismiss"
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Online sync account dialog ── */}
      <SyncAccountModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        className={archivo.className}
      />
    </div>
  );
}
