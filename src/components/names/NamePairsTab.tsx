"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getDivineNamePairs, getMeta } from "@/lib/data/loader";
import { DIVINE_NAME_TOPICS } from "@/lib/topics/topicDefinitions";
import { NamePairDetail } from "./NamePairDetail";
import { useT } from "@/lib/i18n/LanguageContext";
import type { DivineNamePairsFile, MetaFile } from "@/lib/data/types";

const LABEL_BY_SLUG = new Map(DIVINE_NAME_TOPICS.map((topic) => [topic.slug, topic]));

/**
 * Every pair of curated Divine Names found immediately adjacent somewhere
 * in the Qur'an (see build-divine-name-pairs.ts), e.g. "العليم الحكيم".
 * Clicking a pair lists every verse it occurs in via NamePairDetail.
 */
export function NamePairsTab() {
  const t = useT();
  const [data, setData] = useState<DivineNamePairsFile | null>(null);
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDivineNamePairs(), getMeta()]).then(([d, m]) => {
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
  const selectedRow = selected !== null ? (data?.pairs[selected] ?? null) : null;
  const loading = !data || !meta;

  return (
    <div>
      <p className="text-sm text-muted">{t.namePairsTab.description}</p>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.namePairsTab.loading}
        </p>
      ) : data.pairs.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.namePairsTab.noResults}</p>
      ) : (
        <>
          <div className="mt-4 divide-y divide-border/60">
            {data.pairs.map((pair, i) => {
              const a = LABEL_BY_SLUG.get(pair.aSlug);
              const b = LABEL_BY_SLUG.get(pair.bSlug);
              return (
                <button
                  key={`${pair.aSlug}|${pair.bSlug}`}
                  type="button"
                  onClick={() => setSelected((prev) => (prev === i ? null : i))}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-start text-sm transition-colors ${
                    selected === i ? "bg-accent/10" : "hover:bg-bg"
                  }`}
                >
                  <span className="arabic-ui text-ink">
                    {a?.labelAr ?? pair.aSlug} {b?.labelAr ?? pair.bSlug}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{t.namePairsTab.occurrencesCount(pair.count)}</span>
                </button>
              );
            })}
          </div>

          {selectedRow && (
            <div className="mt-4 border-t border-border pt-4">
              <NamePairDetail key={`${selectedRow.aSlug}|${selectedRow.bSlug}`} refs={selectedRow.refs} surahMetaByNum={surahMetaByNum} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
