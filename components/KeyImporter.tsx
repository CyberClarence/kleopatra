import { Dices, Import, FileText } from "lucide-react";
import React, { useRef, useState } from "react";
import { LoadingSpinner } from "./ui/loading-spinner";

type KeyImporterComponentProps = {
  heading: React.ReactNode;
  validateImportButtonLabel: React.ReactNode;
  validateImportHandler: (keyString: string) => Promise<void>;
  textareaPlaceholder: string;
  generateRandomKeyLabel?: string;
  generateRandomKeyHandler?: () => Promise<string>;
};

export default function KeyImporter(props: KeyImporterComponentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyString, setKeyString] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChosen = async (files: FileList) => {
    if (!files.length) return;
    setIsLoading(true);
    try {
      const file = files.item(0);
      const text = await file.text();
      setKeyString(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyImport = async () => {
    setIsLoading(true);
    try {
      await props.validateImportHandler(keyString);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!props.generateRandomKeyHandler) return;
    setIsLoading(true);
    try {
      const newKey = await props.generateRandomKeyHandler();
      setKeyString(newKey);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-5 overflow-auto">
      {props.heading}

      {/* Quick action cards */}
      <div className={`grid gap-3 ${props.generateRandomKeyHandler ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {props.generateRandomKeyHandler && (
          <button
            onClick={handleGenerateKey}
            disabled={isLoading}
            className="glass-card group flex items-center gap-4 p-5 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            <div className="icon-wrap flex-shrink-0">
              <Dices className="w-5 h-5 text-cyan-500 group-hover:rotate-12 transition-transform duration-200" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                Generate New Key
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                RSA 4096-bit
              </p>
            </div>
          </button>
        )}

        <button
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="glass-card group flex items-center gap-4 p-5 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files && handleFileChosen(e.target.files)}
          />
          <div className="icon-wrap flex-shrink-0">
            <FileText className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
              Import from File
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              .asc / .pgp / .txt
            </p>
          </div>
        </button>
      </div>

      {/* Paste textarea */}
      <section className="glass-card flex flex-col flex-1 gap-3 p-5 min-h-[260px]">
        <div className="section-label">
          <Import className="w-3 h-3" />
          Or paste key directly
        </div>
        <div className="relative flex-1 flex flex-col">
          <textarea
            value={keyString}
            placeholder={props.textareaPlaceholder}
            onChange={(e) => setKeyString(e.target.value)}
            className="textarea-field flex-1 min-h-[200px] pb-14"
          />
          <button
            onClick={handleKeyImport}
            disabled={!keyString || isLoading}
            className="btn-primary absolute right-3 bottom-3"
          >
            {props.validateImportButtonLabel}
          </button>
        </div>
      </section>

      {isLoading && (
        <div
          className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
          style={{ background: "var(--bg-overlay)" }}
        >
          <div
            className="flex flex-col items-center gap-4 p-8 rounded-2xl"
            style={{
              background: "var(--overlay-card-bg)",
              border: "1px solid var(--overlay-card-border)",
            }}
          >
            <LoadingSpinner className="w-8 h-8 text-cyan-500" />
            <p className="text-sm" style={{ color: "var(--text-accent)" }}>
              Processing your key…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
