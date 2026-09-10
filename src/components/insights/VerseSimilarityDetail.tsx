"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getVerses } from "@/lib/data/loader";
import { AyahCard } from "@/components/ayah/AyahCard";
import { useT } from "@/lib/i18n/LanguageContext";
import type { SurahMeta } from "@/lib/data/types";

/**
 * Fetches and renders the two verses of one similarity pair side by side.
 * The parent gives this a fresh `key` per selected pair, so a new mount is
 * exactly what "the selection changed" means -- same pattern as
 * AbjadAyahBreakdown/WordInfoPanel.
 */
export function VerseSimilarityDetail({
  refA,
  refB,
  surahMetaByNum,
}: {
  refA: { s: number; a: number };
  refB: { s: number; a: number };
  surahMetaByNum: Map<number, SurahMeta>;
}) {
  const t = useT();
  const [selection] = useState({ refA, refB });
  const [verses, setVerses] = useState<Awaited<ReturnType<typeof getVerses>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVerses([selection.refA, selection.refB]).then((v) => {
      if (!cancelled) setVerses(v);
    });
    return () => {
      cancelled = true;
    };
  }, [selection]);

  if (!verses) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" /> {t.insightsPage.verseSimilarityLoading}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {[selection.refA, selection.refB].map((ref) => {
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
            highlightIndices={[]}
          />
        );
      })}
    </div>
  );
}
