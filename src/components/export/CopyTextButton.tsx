"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";
import { useT } from "@/lib/i18n/LanguageContext";

/**
 * A generic "copy as text" button, reused across views that don't warrant
 * the full CSV/JSON/Markdown ExportMenu (collocations, phrase-search
 * results, the comparison table) -- one lightweight, consistent mechanism
 * for making these views portable, matching SavedList's "Copy as Markdown"
 * precedent. Takes the already-built `text` (not a lazy callback): the
 * callers here are cheap to compute and some are server components, which
 * can't pass a function prop across to this client component anyway.
 */
export function CopyTextButton({ text, label }: { text: string; label?: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
      {copied ? t.copyTextButton.copied : (label ?? t.copyTextButton.defaultLabel)}
    </button>
  );
}
