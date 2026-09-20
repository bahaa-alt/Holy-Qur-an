"use client";

import { useState } from "react";
import Link from "next/link";
import { verseHref } from "@/lib/search/suggest";
import { buildKwicLine } from "@/lib/kwic";
import { WordInfoPanel } from "./WordInfoPanel";
import type { SurahMeta } from "@/lib/data/types";

/**
 * One result line: the reference, the matched word in its context, and --
 * since this is where a researcher actually spends their time -- every
 * word in that context tappable for the inspector.
 *
 * Reading pages have had tap-to-inspect for months; result lists rendered
 * the same text as plain, dead prose, so the one place a reader is already
 * scanning words was the one place they could not ask about one. Each row
 * owns its open word, so two rows can be open at once and closing one
 * leaves the other alone.
 */
export function KwicRow({
  surahMeta,
  ayah,
  tokens,
  wordIndex,
}: {
  surahMeta: SurahMeta;
  ayah: number;
  tokens: string[];
  wordIndex: number;
}) {
  const line = buildKwicLine(tokens, wordIndex);
  const [openWord, setOpenWord] = useState<number | null>(null);

  return (
    <div className="border-b border-border/60 py-2 text-sm last:border-0">
      <div className="flex items-baseline gap-3">
        <Link
          href={verseHref(surahMeta.n, ayah)}
          className="w-16 shrink-0 text-xs text-muted hover:text-accent"
        >
          <bdi>
            {surahMeta.n}:{ayah}
          </bdi>
        </Link>
        <p className="uthmani uthmani-interactive min-w-0 flex-1 truncate">
          {line.truncatedBefore && <span className="text-muted">… </span>}
          {line.tokens.map((token, i) => (
            <span key={token.w}>
              <button
                type="button"
                onClick={() => setOpenWord((prev) => (prev === token.w ? null : token.w))}
                aria-pressed={openWord === token.w}
                className={`rounded transition-colors hover:bg-accent/10 ${
                  token.isMatch ? "word-emphasis" : "text-muted"
                } ${openWord === token.w ? "bg-accent/15" : ""}`}
              >
                {token.text}
              </button>
              {i < line.tokens.length - 1 ? " " : ""}
            </span>
          ))}
          {line.truncatedAfter && <span className="text-muted"> …</span>}
        </p>
      </div>

      {openWord !== null && (
        <div className="ms-[4.75rem]">
          {/* Keyed by the word, so tapping a different one remounts the
              panel into its loading state rather than showing the last
              word's answer under the new word. */}
          <WordInfoPanel
            key={`${surahMeta.n}:${ayah}:${openWord}`}
            s={surahMeta.n}
            a={ayah}
            w={openWord}
            token={tokens[openWord - 1] ?? ""}
            onClose={() => setOpenWord(null)}
          />
        </div>
      )}
    </div>
  );
}
