"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

export function AyahActions({
  arabic,
  translation,
  pickthall,
  surah,
  ayah,
}: {
  arabic: string;
  translation: string;
  /** Pickthall's translation, included in "Copy with translation" when present. */
  pickthall?: string;
  surah: number;
  ayah: number;
}) {
  const [copied, setCopied] = useState<"ar" | "both" | null>(null);

  async function handleCopy(kind: "ar" | "both") {
    const translations = [translation, pickthall].filter(Boolean).join("\n");
    const text = kind === "ar" ? arabic : `${arabic}\n\n${translations}\n(${surah}:${ayah})`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      <button type="button" onClick={() => handleCopy("ar")} className="inline-flex items-center gap-1 hover:text-ink">
        {copied === "ar" ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
        Copy Arabic
      </button>
      <button
        type="button"
        onClick={() => handleCopy("both")}
        className="inline-flex items-center gap-1 hover:text-ink"
      >
        {copied === "both" ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
        Copy with translation
      </button>
      <Link href={`/surah/${surah}/?ayah=${ayah}`} className="inline-flex items-center gap-1 hover:text-ink">
        <ExternalLink size={13} /> Open in surah
      </Link>
    </div>
  );
}
