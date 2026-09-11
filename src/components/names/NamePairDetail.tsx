"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getVerses } from "@/lib/data/loader";
import { AyahCard } from "@/components/ayah/AyahCard";
import { useT } from "@/lib/i18n/LanguageContext";
import type { DivineNamePairRef, SurahMeta } from "@/lib/data/types";

/**
 * Fetches and renders every verse one Divine Name pair occurs in. The
 * parent gives this a fresh `key` per selected pair, so a new mount is
 * exactly what "the selection changed" means -- same pattern as
 * VerseSimilarityDetail.
 */
export function NamePairDetail({
  refs,
  surahMetaByNum,
}: {
  refs: readonly DivineNamePairRef[];
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
        <Loader2 size={14} className="animate-spin" /> {t.namePairsTab.loading}
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
          />
        );
      })}
    </div>
  );
}
