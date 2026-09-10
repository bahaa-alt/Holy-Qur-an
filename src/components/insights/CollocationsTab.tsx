"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { getCollocations, getIndex } from "@/lib/data/loader";
import { normalize } from "@/lib/arabic/normalize";
import { rootHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { CollocationsFile, IndexFile, VerbPrepositionRow } from "@/lib/data/types";

function Bar({ row, max }: { row: VerbPrepositionRow; max: number }) {
  const pct = Math.max((row.count / max) * 100, 2);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="arabic-ui w-20 shrink-0 text-sm text-ink">{row.prepositionLemma}</div>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 shrink-0 text-end text-xs text-muted">{row.count.toLocaleString()}</div>
    </div>
  );
}

export function CollocationsTab() {
  const t = useT();
  const [collocations, setCollocations] = useState<CollocationsFile | null>(null);
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [query, setQuery] = useState("");
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCollocations(), getIndex()]).then(([c, i]) => {
      if (!cancelled) {
        setCollocations(c);
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

  const rows = useMemo(
    () => (collocations && selectedRoot ? collocations.verbPrepositions.filter((r) => r.verbRootAr === selectedRoot) : []),
    [collocations, selectedRoot],
  );
  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.count)) : 1;

  const loading = !collocations || !index;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.collocationsHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.collocationsDescription}</p>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.collocationsLoading}
        </p>
      ) : (
        <>
          <div className="mt-4">
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
                  placeholder={t.insightsPage.collocationsRootPlaceholder}
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
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {selectedRoot === null ? (
              <p className="text-sm text-muted">{t.insightsPage.collocationsPickPrompt}</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted">{t.insightsPage.collocationsNoResults}</p>
            ) : (
              <>
                {rows.map((row) => (
                  <Bar key={row.prepositionKey} row={row} max={max} />
                ))}
                <Link href={rootHref(selectedRoot)} className="mt-2 inline-block text-xs text-accent hover:text-accent-strong">
                  {selectedRoot} →
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
