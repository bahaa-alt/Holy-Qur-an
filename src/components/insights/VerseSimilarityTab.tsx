"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getVerseSimilarity } from "@/lib/data/loader";
import { globalIdToRef } from "@/lib/data/verseId";
import { pairInScope, type SimilarityScopeMode } from "@/lib/insights/verseSimilarityScope";
import { scopeFromParam, scopeToParam, type Scope } from "@/lib/insights/scope";
import { ScopeSelector } from "./ScopeSelector";
import { VerseSimilarityDetail } from "./VerseSimilarityDetail";
import { ExportButton } from "@/components/export/ExportButton";
import { SaveButton } from "@/components/notes/SaveButton";
import { useUrlParam } from "@/lib/hooks/useUrlParam";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ExportTable } from "@/lib/export/table";
import type { MetaFile, VerseSimilarityFile } from "@/lib/data/types";

const MODE_PILL_CLASS = (active: boolean) =>
  `rounded-md px-2.5 py-1 text-xs ${active ? "bg-accent text-accent-fg" : "text-muted hover:text-ink"}`;

function parseMode(raw: string | null): SimilarityScopeMode | null {
  return raw === "both" || raw === "either" ? raw : null;
}

/**
 * Similar verses were a whole-Qur'an-only leaderboard before this. Unlike
 * every other tool scoped so far, a similarity pair does not have a
 * count to restrict -- it already IS two verse identities, so a scope
 * asks a membership question instead (see verseSimilarityScope.ts): does
 * a passage echo ITSELF ("both" verses inside the scope), or does it
 * echo something ELSEWHERE ("either" verse inside)?
 *
 * VerseSimilarityFile ships every pair clearing the similarity floor,
 * not a truncated top-N, and Jaccard is a property of the pair itself
 * rather than a corpus-wide rate -- so unlike Collocations/Cooccurrence
 * (PMI) or Formulas (a fixed top-25 list), scoping this needs no caveat.
 */
export function VerseSimilarityTab({ meta }: { meta: MetaFile }) {
  const t = useT();
  const [data, setData] = useState<VerseSimilarityFile | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [scope, setScope] = useUrlParam<Scope>(
    "verseSimScope",
    { kind: "quran" },
    scopeFromParam,
    scopeToParam,
  );
  const [mode, setMode] = useUrlParam<SimilarityScopeMode>(
    "verseSimMode",
    "both",
    parseMode,
    (v) => v,
  );

  useEffect(() => {
    let cancelled = false;
    getVerseSimilarity().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const surahMetaByNum = useMemo(() => new Map(meta.surahs.map((s) => [s.n, s])), [meta]);

  const allRows = useMemo(() => {
    if (!data) return [];
    return data.pairs
      .map((pair, i) => {
        const refA = globalIdToRef(meta, pair.a);
        const refB = globalIdToRef(meta, pair.b);
        if (!refA || !refB) return null;
        return { i, pair, refA, refB };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [data, meta]);

  const rows = useMemo(
    () => allRows.filter((r) => pairInScope(scope, r.refA, r.refB, mode)),
    [allRows, scope, mode],
  );

  const loading = !data;

  function buildTable(): ExportTable {
    const scopeLabel = scopeToParam(scope);
    return {
      slug: `verse-similarity-${scopeLabel.replace(":", "-")}-${mode}`,
      meta: {
        title: t.insightsPage.verseSimilarityHeading,
        provenance: [
          { label: "scope", value: scopeLabel },
          {
            label: "mode",
            value: mode === "both" ? "both verses in scope" : "either verse in scope",
          },
        ],
      },
      columns: [
        { key: "verse_a", label: "verse_a" },
        { key: "verse_b", label: "verse_b" },
        { key: "shared_roots", label: "shared_roots" },
        { key: "jaccard", label: "jaccard" },
      ],
      rows: rows.map((r) => [
        `${r.refA.s}:${r.refA.a}`,
        `${r.refB.s}:${r.refB.a}`,
        r.pair.sharedRoots,
        r.pair.jaccard.toFixed(4),
      ]),
    };
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.verseSimilarityHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.verseSimilarityDescription}</p>

      <div className="mt-4">
        <ScopeSelector
          scope={scope}
          onChange={setScope}
          meta={meta}
          labels={t.insightsPage.compare}
        />
      </div>
      {scope.kind !== "quran" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex w-fit rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setMode("both")}
              className={MODE_PILL_CLASS(mode === "both")}
            >
              {t.insightsPage.verseSimilarityModeBoth}
            </button>
            <button
              type="button"
              onClick={() => setMode("either")}
              className={MODE_PILL_CLASS(mode === "either")}
            >
              {t.insightsPage.verseSimilarityModeEither}
            </button>
          </div>
          <p className="text-xs text-muted">{t.insightsPage.verseSimilarityModeHint}</p>
        </div>
      )}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.verseSimilarityLoading}
        </p>
      ) : (
        <>
          <div className="mt-4 flex justify-end gap-2">
            <SaveButton
              id={`view:verseSimilarity:${scopeToParam(scope)}:${mode}`}
              kind="view"
              label={t.insightsPage.verseSimilarityHeading}
              detail={scopeToParam(scope)}
              href={`/insights/?tab=verseSimilarity&verseSimScope=${scopeToParam(scope)}&verseSimMode=${mode}`}
              compact
            />
            <ExportButton
              path={`/insights/?tab=verseSimilarity&verseSimScope=${scopeToParam(scope)}&verseSimMode=${mode}`}
              subject={{ kind: "verseSimilarity", label: scopeToParam(scope) }}
              resolve={buildTable}
            />
          </div>

          {rows.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{t.insightsPage.verseSimilarityNoResults}</p>
          ) : (
            <>
              <p className="mt-2 text-xs text-muted">{t.insightsPage.verseSimilarityPickPrompt}</p>
              <div className="mt-1 divide-y divide-border/60">
                {rows.map((row) => (
                  <div key={row.i}>
                    <button
                      type="button"
                      onClick={() => setSelected((prev) => (prev === row.i ? null : row.i))}
                      aria-expanded={selected === row.i}
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
                        {t.insightsPage.verseSimilarityJaccard(Math.round(row.pair.jaccard * 100))}{" "}
                        · {t.insightsPage.verseSimilaritySharedRoots(row.pair.sharedRoots)}
                      </span>
                    </button>
                    {/* Expands directly under the row that opened it, not at
                        the bottom of however many rows are above it -- a
                        list here can run into the hundreds, and jumping a
                        reader past all of them to see what they just tapped
                        was the whole complaint. */}
                    {selected === row.i && (
                      <div className="rounded-lg bg-bg/60 px-2 pb-3 pt-1">
                        <VerseSimilarityDetail
                          key={row.i}
                          refA={row.refA}
                          refB={row.refB}
                          surahMetaByNum={surahMetaByNum}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
