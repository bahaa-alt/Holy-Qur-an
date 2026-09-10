"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getMeta, getVerseSimilarity } from "@/lib/data/loader";
import { globalIdToRef } from "@/lib/data/verseId";
import { VerseSimilarityDetail } from "./VerseSimilarityDetail";
import { useT } from "@/lib/i18n/LanguageContext";
import type { MetaFile, VerseSimilarityFile } from "@/lib/data/types";

export function VerseSimilarityTab() {
  const t = useT();
  const [data, setData] = useState<VerseSimilarityFile | null>(null);
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getVerseSimilarity(), getMeta()]).then(([d, m]) => {
      if (!cancelled) {
        setData(d);
        setMeta(m);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const surahMetaByNum = useMemo(() => new Map(meta?.surahs.map((s) => [s.n, s]) ?? []), [meta]);

  const rows = useMemo(() => {
    if (!data || !meta) return [];
    return data.pairs
      .map((pair, i) => {
        const refA = globalIdToRef(meta, pair.a);
        const refB = globalIdToRef(meta, pair.b);
        if (!refA || !refB) return null;
        return { i, pair, refA, refB };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [data, meta]);

  const selectedRow = selected !== null ? rows.find((r) => r.i === selected) : null;
  const loading = !data || !meta;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.verseSimilarityHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.verseSimilarityDescription}</p>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.verseSimilarityLoading}
        </p>
      ) : (
        <>
          <div className="mt-4 divide-y divide-border/60">
            {rows.map((row) => (
              <button
                key={row.i}
                type="button"
                onClick={() => setSelected((prev) => (prev === row.i ? null : row.i))}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-start text-sm transition-colors ${
                  selected === row.i ? "bg-accent/10" : "hover:bg-bg"
                }`}
              >
                <span className="text-ink">
                  <bdi>
                    {row.refA.s}:{row.refA.a}
                  </bdi>{" "}
                  ↔{" "}
                  <bdi>
                    {row.refB.s}:{row.refB.a}
                  </bdi>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {t.insightsPage.verseSimilarityJaccard(Math.round(row.pair.jaccard * 100))} ·{" "}
                  {t.insightsPage.verseSimilaritySharedRoots(row.pair.sharedRoots)}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {!selectedRow ? (
              <p className="text-sm text-muted">{t.insightsPage.verseSimilarityPickPrompt}</p>
            ) : (
              <VerseSimilarityDetail
                key={selectedRow.i}
                refA={selectedRow.refA}
                refB={selectedRow.refB}
                surahMetaByNum={surahMetaByNum}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
