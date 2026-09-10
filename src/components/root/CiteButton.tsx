"use client";

import { useState } from "react";
import { Check, Quote } from "lucide-react";
import { buildCitation, type CitationSubject } from "@/lib/citation/buildCitation";
import { copyToClipboard } from "@/lib/clipboard";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ManifestFile } from "@/lib/data/types";

export function CiteButton({
  subject,
  manifest,
}: {
  subject: CitationSubject;
  manifest: Pick<ManifestFile, "version" | "builtAt" | "hash">;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const citation = buildCitation(subject, manifest, window.location.href);
    const ok = await copyToClipboard(citation);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? <Check size={13} className="text-accent" /> : <Quote size={13} />}
      {copied ? t.citeButton.copied : t.citeButton.cite}
    </button>
  );
}
