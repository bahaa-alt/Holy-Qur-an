"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getArIndex, getMeta } from "@/lib/data/loader";
import { globalIdToRef } from "@/lib/data/verseId";
import { OPENING_PHRASES, findVersesStartingWith } from "@/lib/names/openingPhrases";
import { OpeningPhraseDetail, type OpeningMatchRef } from "./OpeningPhraseDetail";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ArIndexFile, MetaFile } from "@/lib/data/types";

const PILL_CLASS = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-sm transition-colors ${
    active ? "border-accent bg-accent/10 text-accent" : "border-border text-ink hover:border-accent hover:text-accent"
  }`;

/**
 * Browses every verse whose Arabic text literally opens with one of a
 * curated set of Allah-invoking phrases (OPENING_PHRASES) -- computed
 * entirely client-side from ar-index.json, same as VerseSimilarityTab's
 * on-demand fetch pattern, no dedicated build step needed.
 */
export function OpeningPhrasesTab() {
  const t = useT();
  const [arIndex, setArIndex] = useState<ArIndexFile | null>(null);
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getArIndex(), getMeta()]).then(([ai, m]) => {
      if (!cancelled) {
        setArIndex(ai);
        setMeta(m);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPhrase = OPENING_PHRASES.find((p) => p.slug === selectedSlug) ?? null;

  const matches: OpeningMatchRef[] = useMemo(() => {
    if (!arIndex || !meta || !selectedPhrase) return [];
    return findVersesStartingWith(selectedPhrase.phraseAr, arIndex).flatMap((m) => {
      const ref = globalIdToRef(meta, m.globalId);
      return ref ? [{ s: ref.s, a: ref.a, startW: m.startW, endW: m.endW }] : [];
    });
  }, [arIndex, meta, selectedPhrase]);

  const surahMetaByNum = useMemo(() => new Map(meta?.surahs.map((s) => [s.n, s]) ?? []), [meta]);
  const loading = !arIndex || !meta;

  return (
    <div>
      <p className="text-sm text-muted">{t.openingPhrasesTab.description}</p>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.openingPhrasesTab.loading}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {OPENING_PHRASES.map((phrase) => (
              <button
                key={phrase.slug}
                type="button"
                onClick={() => setSelectedSlug((prev) => (prev === phrase.slug ? null : phrase.slug))}
                className={PILL_CLASS(selectedSlug === phrase.slug)}
              >
                <span className="arabic-ui">{phrase.phraseAr}</span>
                <span className="ms-2 text-xs text-muted">{phrase.labelEn}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {!selectedPhrase ? (
              <p className="text-sm text-muted">{t.openingPhrasesTab.pickPrompt}</p>
            ) : matches.length === 0 ? (
              <p className="text-sm text-muted">{t.openingPhrasesTab.noResults}</p>
            ) : (
              <OpeningPhraseDetail key={selectedPhrase.slug} matches={matches} surahMetaByNum={surahMetaByNum} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
