"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getVerses } from "@/lib/data/loader";
import { AyahCard } from "@/components/ayah/AyahCard";
import { useT } from "@/lib/i18n/LanguageContext";
import type { SurahMeta } from "@/lib/data/types";

export interface PhraseMatchRef {
  s: number;
  a: number;
  startW: number;
  endW: number;
}

/**
 * Fetches and renders every verse matching one Name Phrases selection.
 * The parent gives this a fresh `key` per selected phrase, so a new mount
 * is exactly what "the selection changed" means -- same pattern as
 * VerseSimilarityDetail/NamePairDetail.
 */
export function PhraseDetail({
  matches,
  surahMetaByNum,
}: {
  matches: readonly PhraseMatchRef[];
  surahMetaByNum: Map<number, SurahMeta>;
}) {
  const t = useT();
  const [selection] = useState(matches);
  const [verses, setVerses] = useState<Awaited<ReturnType<typeof getVerses>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVerses(selection).then((v) => {
      if (!cancelled) setVerses(v);
    });
    return () => {
      cancelled = true;
    };
  }, [selection]);

  if (!verses) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" /> {t.namePhrasesTab.loading}
      </p>
    );
  }

  return (
    <>
      <p className="text-xs text-muted">{t.namePhrasesTab.versesCount(selection.length)}</p>
      <div className="mt-3 space-y-4">
        {selection.map((m) => {
          const verse = verses.get(`${m.s}:${m.a}`);
          const surahMeta = surahMetaByNum.get(m.s);
          if (!verse || !surahMeta) return null;
          const highlightIndices = Array.from({ length: m.endW - m.startW + 1 }, (_, i) => m.startW + i);
          return (
            <AyahCard
              key={`${m.s}:${m.a}`}
              surahMeta={surahMeta}
              ayah={m.a}
              tokens={verse.w}
              translation={verse.t}
              pickthall={verse.pickthall}
              highlightIndices={highlightIndices}
            />
          );
        })}
      </div>
    </>
  );
}
