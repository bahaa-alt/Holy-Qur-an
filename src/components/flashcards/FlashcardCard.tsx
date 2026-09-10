"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRoot, getVerses } from "@/lib/data/loader";
import { buildOccurrenceRows, filterRows } from "@/lib/root/occurrences";
import { rootHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { CardDef } from "@/lib/flashcards/types";
import type { SurahVerse } from "@/lib/data/types";

interface CardDetails {
  /** the card id these details were fetched for -- lets render logic detect
   * "these details are stale, the card changed" without a synchronous
   * setState-to-null in the effect body below. */
  id: string;
  glossShort: string;
  examples: { s: number; a: number; verse: SurahVerse }[];
}

/**
 * A single flip card: front is just the Arabic root/lemma text; the back
 * (root gloss + up to 2 example verses) is only fetched once the card is
 * actually flipped, and only for the currently-shown card -- not the whole
 * deck up front.
 */
export function FlashcardCard({
  card,
  flipped,
  onFlip,
}: {
  card: CardDef;
  flipped: boolean;
  onFlip: () => void;
}) {
  const t = useT();
  const [details, setDetails] = useState<CardDetails | null>(null);

  useEffect(() => {
    if (!flipped) return;
    let cancelled = false;
    getRoot(card.root).then(async (file) => {
      const rows = buildOccurrenceRows(file);
      const filtered = card.lemmaKey ? filterRows(rows, { lemmaKey: card.lemmaKey }) : rows;
      const refs = filtered.slice(0, 2).map((r) => ({ s: r.s, a: r.a }));
      const verseMap = await getVerses(refs);
      if (cancelled) return;
      const examples = refs
        .map((r) => ({ ...r, verse: verseMap.get(`${r.s}:${r.a}`) }))
        .filter((e): e is { s: number; a: number; verse: SurahVerse } => !!e.verse);
      setDetails({ id: card.id, glossShort: file.gloss?.short ?? "", examples });
    });
    return () => {
      cancelled = true;
    };
  }, [card, flipped]);

  // Details fetched for a previous card are stale until overwritten -- guard
  // by id instead of resetting state synchronously in the effect above.
  const currentDetails = details?.id === card.id ? details : null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center">
      <p className="arabic-ui text-3xl text-ink">{card.ar}</p>

      {!flipped ? (
        <button
          type="button"
          onClick={onFlip}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-sm text-ink hover:border-accent"
        >
          {t.flashcardsPage.flip}
        </button>
      ) : currentDetails ? (
        <div className="mt-6 space-y-3 text-start">
          {currentDetails.glossShort && <p className="text-sm text-muted">{currentDetails.glossShort}</p>}
          <Link href={rootHref(card.root)} className="arabic-ui inline-block text-sm text-accent hover:underline">
            {card.root}
          </Link>
          {currentDetails.examples.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              {currentDetails.examples.map((e) => (
                <div key={`${e.s}:${e.a}`}>
                  <p className="arabic-ui text-base text-ink">{e.verse.w.join(" ")}</p>
                  <p className="text-xs text-muted">{e.verse.t}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">…</p>
      )}
    </div>
  );
}
