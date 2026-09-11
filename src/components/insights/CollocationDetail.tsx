"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getVerses } from "@/lib/data/loader";
import { AyahCard } from "@/components/ayah/AyahCard";
import { useT } from "@/lib/i18n/LanguageContext";
import type { SurahMeta, VerbPrepositionRow } from "@/lib/data/types";

/**
 * Fetches and renders every verse one verb+preposition collocation occurs
 * in, the verb and the following (preposition-bearing) word highlighted.
 * The parent gives this a fresh `key` per selected combo, so a new mount
 * is exactly what "the selection changed" means -- same pattern as
 * NamePairDetail/VerseSimilarityDetail.
 */
export function CollocationDetail({
  refs,
  surahMetaByNum,
}: {
  refs: VerbPrepositionRow["refs"];
  surahMetaByNum: Map<number, SurahMeta>;
}) {
  const t = useT();
  const [selection] = useState(refs);
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
        <Loader2 size={14} className="animate-spin" /> {t.common.loading}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {selection.map((ref) => {
        const verse = verses.get(`${ref.s}:${ref.a}`);
        const surahMeta = surahMetaByNum.get(ref.s);
        if (!verse || !surahMeta) return null;
        return (
          <AyahCard
            key={`${ref.s}:${ref.a}`}
            surahMeta={surahMeta}
            ayah={ref.a}
            tokens={verse.w}
            translation={verse.t}
            pickthall={verse.pickthall}
            highlightIndices={[ref.w, ref.w + 1]}
            emphasisIndex={ref.w}
          />
        );
      })}
    </div>
  );
}
