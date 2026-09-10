"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getRoot } from "@/lib/data/loader";
import { buildRootSummary, type RootSummary } from "@/lib/root/summary";
import { buildComparisonCategoryRows, buildComparisonMarkdown } from "@/lib/compare/buildComparisonRows";
import { decodeRootsQuery, encodeRootsQuery } from "@/lib/compare/query";
import { RootPicker, type CompareRootRow } from "./RootPicker";
import { CompareStatsTable } from "./CompareStatsTable";
import { CompareCategoryBars } from "./CompareCategoryBars";
import { CopyTextButton } from "@/components/export/CopyTextButton";

export function CompareView({ roots }: { roots: CompareRootRow[] }) {
  // Starts empty to match the prerendered static HTML (a static-export page
  // has no server to answer differing query strings, so the prerendered
  // markup never has a selection). The real initial selection is read from
  // the URL in the mount effect below, strictly *after* hydration -- reading
  // it via useState's lazy initializer instead would make the very first
  // client render diverge from the server-rendered markup and trip a
  // hydration mismatch (confirmed with a real browser: React error #418) on
  // any direct/deep link carrying a `?roots=` query.
  const [selected, setSelected] = useState<string[]>([]);
  const [summaries, setSummaries] = useState<Map<string, RootSummary>>(new Map());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = decodeRootsQuery(new URLSearchParams(window.location.search).get("roots"));
    if (initial.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the URL, not a subscription; see comment above.
      setSelected(initial);
    }
    setHydrated(true);
  }, []);

  // Keeps the URL in sync with the current selection so the page is
  // shareable/bookmarkable -- a legitimate "sync state to an external
  // system" effect, not a state-reset-on-prop-change. Skipped until after
  // the hydration effect above has run, so it never clobbers a `?roots=`
  // query with the empty pre-hydration selection.
  useEffect(() => {
    if (!hydrated) return;
    const query = encodeRootsQuery(selected);
    const next = query ? `${window.location.pathname}?roots=${query}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [selected, hydrated]);

  useEffect(() => {
    const missing = selected.filter((r) => !summaries.has(r));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.map((r) => getRoot(r))).then((files) => {
      if (cancelled) return;
      setSummaries((prev) => {
        const next = new Map(prev);
        for (const file of files) {
          if (file.root) next.set(file.root, buildRootSummary(file));
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [selected, summaries]);

  const loadedSummaries = useMemo(
    () => selected.map((r) => summaries.get(r)).filter((s): s is RootSummary => s !== undefined),
    [selected, summaries],
  );
  const stillLoading = selected.length > 0 && loadedSummaries.length < selected.length;

  const categoryRows = useMemo(() => buildComparisonCategoryRows(loadedSummaries), [loadedSummaries]);

  return (
    <div className="space-y-6">
      <RootPicker roots={roots} selected={selected} onChange={setSelected} />

      {stillLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading roots…
        </div>
      )}

      {!stillLoading && loadedSummaries.length >= 2 && (
        <>
          <div className="flex justify-end">
            <CopyTextButton text={buildComparisonMarkdown(loadedSummaries, categoryRows)} />
          </div>
          <CompareStatsTable summaries={loadedSummaries} />
          <CompareCategoryBars
            rows={categoryRows}
            labels={loadedSummaries.map((s) => s.root ?? "")}
          />
        </>
      )}

      {!stillLoading && selected.length === 1 && (
        <p className="text-center text-sm text-muted">Pick at least one more root to compare.</p>
      )}
    </div>
  );
}
