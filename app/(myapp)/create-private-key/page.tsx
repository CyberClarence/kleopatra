"use client";
import * as openpgp from "openpgp";
import { Shield, Key, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useKeyStore } from "@/feature/keystore";
import { useRouter } from "next/navigation";
import KeyImporter from "@/components/KeyImporter";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog } from "@/components/ui/dialog";

const TEXTAREA_PLACEHOLDER = `-----BEGIN PGP PRIVATE KEY BLOCK-----

lQVYBGaTvVsBDADZQTd3aWlBH3RmyZCqEL5URrLIBgT8i44F0UsktvoJCxRT7Y9B
TKHcryIoIseTjkJxIoF2nSxC64ytG7b1FlM1bx7dskFOa8ASpjpLZ2o4xPoKDpoz...`;

export default function ImportNewPrivateKey() {
  const importNewPrivateKeyToMyStore = useKeyStore((s) => s.importPrivateKey);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [pendingKey, setPendingKey] = useState("");

  const handleKeyImport = async (keyString: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await openpgp.readPrivateKey({ armoredKey: keyString });
      setPendingKey(keyString);
      setShowNameDialog(true);
    } catch (err) {
      console.error(err);
      setError("Invalid private key format. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!keyName.trim()) {
      setError("Key name is required");
      return;
    }
    setIsLoading(true);
    try {
      const newKey = await importNewPrivateKeyToMyStore(keyName, pendingKey);
      router.push(`/private/${newKey.id}`);
    } catch (err) {
      setError("Failed to import key");
    } finally {
      setIsLoading(false);
      setShowNameDialog(false);
    }
  };

  const generateRandomKeyHandler = async () => {
    setIsLoading(true);
    try {
      const { privateKey } = await openpgp.generateKey({
        type: "rsa",
        rsaBits: 4096,
        userIDs: [{ name: "User", email: "user@kleopatra.app" }],
        format: "armored",
      });
      return privateKey;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full overflow-auto">
      <div className="flex-1 px-5 py-6 md:px-8 max-w-4xl mx-auto w-full">
        <KeyImporter
          heading={
            <header className="flex items-center gap-3">
              <div className="icon-wrap">
                <Shield className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="section-label mb-0.5">Private Key</p>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-heading)" }}>
                  Create or Import Private Key
                </h1>
              </div>
            </header>
          }
          textareaPlaceholder={TEXTAREA_PLACEHOLDER}
          validateImportButtonLabel={
            <span className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Validate & Import
            </span>
          }
          validateImportHandler={handleKeyImport}
          generateRandomKeyHandler={generateRandomKeyHandler}
          generateRandomKeyLabel="RSA 4096-bit"
        />
      </div>

      <Dialog isOpen={showNameDialog} onClose={() => setShowNameDialog(false)} title="Name Your Key">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
              Key Name
            </label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              className="input-field"
              placeholder="e.g. Work Key, Personal Key…"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNameDialog(false)} className="btn-neutral">Cancel</button>
            <button onClick={handleNameSubmit} className="btn-primary">
              <Key className="w-4 h-4" />
              Save & Import
            </button>
          </div>
        </div>
      </Dialog>

      {isLoading && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50" style={{ background: "var(--bg-overlay)" }}>
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl" style={{ background: "var(--overlay-card-bg)", border: "1px solid var(--overlay-card-border)" }}>
            <LoadingSpinner className="w-8 h-8 text-cyan-500" />
            <p className="text-sm" style={{ color: "var(--text-accent)" }}>Processing key…</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-5 right-5 max-w-sm animate-slide-up flex items-start gap-3 p-4 rounded-xl shadow-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--danger-border)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--danger-text)" }} />
          <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{error}</p>
          <button onClick={() => setError(null)} className="text-xs" style={{ color: "var(--text-tertiary)" }}>✕</button>
        </div>
      )}
    </div>
  );
}
