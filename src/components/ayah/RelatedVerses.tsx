"use client";

import { useState } from "react";
import Link from "next/link";
import { Link2, Loader2 } from "lucide-react";
import { getIndex, getMeta, getRoot, getVerseRoots } from "@/lib/data/loader";
import { globalIdToRef, refToGlobalId } from "@/lib/data/verseId";
import { findRelatedVerses, type RelatedVerse } from "@/lib/related/findRelatedVerses";
import { useT } from "@/lib/i18n/LanguageContext";

interface RelatedRow {
  s: number;
  a: number;
  sharedRoots: number;
}

/**
 * On-demand "verses that share roots with this one" disclosure. Kept
 * lazy/click-to-reveal rather than always-on: computing it means fetching
 * every root file this verse's own roots belong to, which is fine per
 * click but too much to do eagerly for every card in a 25-per-page list.
 */
export function RelatedVerses({ s, a }: { s: number; a: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [rows, setRows] = useState<RelatedRow[]>([]);

  async function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (loaded) return;

    setLoading(true);
    try {
      const [verseRoots, meta, index] = await Promise.all([getVerseRoots(), getMeta(), getIndex()]);
      const globalId = refToGlobalId(meta, s, a);
      if (globalId === null) return;

      const targetRootIdxs = [...new Set((verseRoots[globalId] ?? []).map(([rootIdx]) => rootIdx))];
      const verseSetsByRoot = new Map<number, ReadonlySet<number>>();
      await Promise.all(
        targetRootIdxs.map(async (rootIdx) => {
          const rootAr = index.roots[rootIdx]?.ar;
          if (!rootAr) return;
          const file = await getRoot(rootAr);
          const verseSet = new Set<number>();
          for (const [os, oa] of file.occ) {
            const id = refToGlobalId(meta, os, oa);
            if (id !== null) verseSet.add(id);
          }
          verseSetsByRoot.set(rootIdx, verseSet);
        }),
      );

      const related: RelatedVerse[] = findRelatedVerses(globalId, targetRootIdxs, verseSetsByRoot);
      const resolved = related
        .map((r) => {
          const ref = globalIdToRef(meta, r.globalId);
          return ref ? { s: ref.s, a: ref.a, sharedRoots: r.sharedRoots } : null;
        })
        .filter((r): r is RelatedRow => r !== null);
      setRows(resolved);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
        {t.relatedVerses.heading}
      </button>

      {open && !loading && (
        <div className="mt-2 flex flex-wrap gap-2">
          {rows.length === 0 ? (
            <p className="text-xs text-muted">{t.relatedVerses.none}</p>
          ) : (
            rows.map((r) => (
              <Link
                key={`${r.s}:${r.a}`}
                href={`/surah/${r.s}/?ayah=${r.a}`}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-ink transition-colors hover:border-accent hover:text-accent"
              >
                <bdi>
                  {r.s}:{r.a}
                </bdi>
                <span className="text-muted">{t.relatedVerses.sharedCount(r.sharedRoots)}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
