"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { getCooccurrence, getIndex } from "@/lib/data/loader";
import { normalize } from "@/lib/arabic/normalize";
import { rootHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { CooccurrenceFile, IndexFile, RootCooccurrencePartner } from "@/lib/data/types";

function PartnerBar({ row, max }: { row: RootCooccurrencePartner; max: number }) {
  const pct = Math.max((row.count / max) * 100, 2);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Link href={rootHref(row.root)} className="arabic-ui w-20 shrink-0 text-sm text-accent hover:text-accent-strong">
        {row.root}
      </Link>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-24 shrink-0 text-end text-xs text-muted">{row.count.toLocaleString()}</div>
    </div>
  );
}

export function CooccurrenceTab() {
  const t = useT();
  const [cooccurrence, setCooccurrence] = useState<CooccurrenceFile | null>(null);
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [query, setQuery] = useState("");
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCooccurrence(), getIndex()]).then(([c, i]) => {
      if (!cancelled) {
        setCooccurrence(c);
        setIndex(i);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(() => {
    if (!index) return [];
    const q = normalize(query.trim());
    if (q === "") return [];
    return index.roots.filter((r) => r.key.includes(q)).slice(0, 8);
  }, [index, query]);

  const partners = selectedRoot ? (cooccurrence?.byRoot[selectedRoot] ?? []) : [];
  const max = partners.length > 0 ? Math.max(...partners.map((p) => p.count)) : 1;

  const loading = !cooccurrence || !index;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.cooccurrenceHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.cooccurrenceDescription}</p>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.cooccurrenceLoading}
        </p>
      ) : (
        <>
          <h3 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
            {t.insightsPage.cooccurrenceTopPairsHeading}
          </h3>
          <div className="mt-2 divide-y divide-border/60">
            {cooccurrence.topPairs.slice(0, 15).map((pair, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  <Link href={rootHref(pair.rootA)} className="arabic-ui text-accent hover:text-accent-strong">
                    {pair.rootA}
                  </Link>
                  <span className="text-muted">+</span>
                  <Link href={rootHref(pair.rootB)} className="arabic-ui text-accent hover:text-accent-strong">
                    {pair.rootB}
                  </Link>
                </span>
                <span className="text-xs text-muted">{t.insightsPage.cooccurrenceSharedVerses(pair.count)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-4">
            {selectedRoot ? (
              <span className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-ink">
                {selectedRoot}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoot(null);
                    setQuery("");
                  }}
                  className="text-muted hover:text-ink"
                >
                  <X size={13} />
                </button>
              </span>
            ) : (
              <>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.insightsPage.cooccurrenceRootPlaceholder}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none"
                />
                {matches.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {matches.map((r) => (
                      <button
                        key={r.ar}
                        type="button"
                        onClick={() => {
                          setSelectedRoot(r.ar);
                          setQuery("");
                        }}
                        className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        {r.ar}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="mt-4">
              {selectedRoot === null ? (
                <p className="text-sm text-muted">{t.insightsPage.cooccurrencePickPrompt}</p>
              ) : partners.length === 0 ? (
                <p className="text-sm text-muted">{t.insightsPage.cooccurrenceNoResults}</p>
              ) : (
                <>
                  {partners.map((p) => (
                    <PartnerBar key={p.root} row={p} max={max} />
                  ))}
                  <Link href={rootHref(selectedRoot)} className="mt-2 inline-block text-xs text-accent hover:text-accent-strong">
                    {selectedRoot} →
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
