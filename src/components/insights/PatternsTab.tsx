"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getIndex, getOccurrenceIndex, getPatterns } from "@/lib/data/loader";
import { ROMAN_FORMS } from "@/lib/morphology/classify";
import { classifyRootShape, type RootShape } from "@/lib/morphology/rootShape";
import { rootHref } from "@/lib/search/suggest";
import { encodeAdvancedSearchQuery } from "@/lib/search/advancedSearchQuery";
import { scopedPatterns } from "@/lib/insights/patternsScope";
import { scopeFromParam, scopeToParam, type Scope } from "@/lib/insights/scope";
import { ScopeSelector } from "./ScopeSelector";
import { ExportButton } from "@/components/export/ExportButton";
import { SaveButton } from "@/components/notes/SaveButton";
import { useUrlParam } from "@/lib/hooks/useUrlParam";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ExportTable } from "@/lib/export/table";
import type { Cat, IndexFile, MetaFile, OccurrenceIndexFile, PatternsFile } from "@/lib/data/types";

const ROOTS_SHOWN = 40;

/**
 * A scoped verb Form/category can still link into Advanced Search --
 * surah and revelation scopes both have an exact equivalent there
 * (surahFrom/surahTo, revelation). Juz' and a chronological window do
 * not (the same gap scopeToQcqlFilter documents for QCQL: a juz' crosses
 * surah boundaries, and a chrono window is a scattered set of surah
 * numbers Advanced Search's contiguous surahFrom/surahTo cannot name).
 * Those two scopes drop the link rather than point at the wrong verses.
 */
function advancedSearchHref(
  partial: { cats?: Cat[]; verbForms?: number[] },
  scope: Scope,
): string | null {
  let surahFrom = 1;
  let surahTo = 114;
  let revelation: "all" | "meccan" | "medinan" = "all";
  if (scope.kind === "surah") {
    surahFrom = scope.n;
    surahTo = scope.n;
  } else if (scope.kind === "revelation") {
    revelation = scope.value;
  } else if (scope.kind === "juz" || scope.kind === "chrono") {
    return null;
  }
  const query = encodeAdvancedSearchQuery({
    cats: partial.cats ?? [],
    verbForms: partial.verbForms ?? [],
    revelation,
    rootArs: [],
    wordSyntaxTags: [],
    verseSyntaxTags: [],
    surahFrom,
    surahTo,
    page: 0,
  });
  return `/search/advanced/?${query}`;
}

function Bar({
  label,
  count,
  sub,
  max,
  href,
  onClick,
  active,
}: {
  label: string;
  count: number;
  sub: string;
  max: number;
  href?: string | null;
  onClick?: () => void;
  active?: boolean;
}) {
  const pct = Math.max((count / max) * 100, 2);
  const content = (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${active ? "bg-accent/10" : href || onClick ? "hover:bg-bg" : ""}`}
    >
      <div className="w-28 shrink-0 text-sm text-ink">{label}</div>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-40 shrink-0 text-end text-xs text-muted">
        {count.toLocaleString()} <span className="text-muted/70">· {sub}</span>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-start">
        {content}
      </button>
    );
  }
  return <div>{content}</div>;
}

/**
 * Morphological pattern productivity was a whole-Qur'an-only leaderboard
 * before this. Scoping it means recomputing from occurrences.json (see
 * lib/insights/patternsScope.ts's doc comment for the full picture, and
 * for why "just trust verbForm" is a real trap: a Form's participle and
 * verbal noun carry the same VF: tag its finite verb does). Root shapes
 * come out exact at any scope; verb-Form and category counts use each
 * word-form's usual category rather than this specific occurrence's own
 * tag, the same approximation Advanced Search's own filters already run
 * on -- close to the shipped figures in practice, not identical. That
 * note only appears once a scope narrows past "quran", where the tab
 * shows patterns.json's exact shipped figures unchanged.
 */
export function PatternsTab({ meta }: { meta: MetaFile }) {
  const t = useT();
  const [patterns, setPatterns] = useState<PatternsFile | null>(null);
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [occurrences, setOccurrences] = useState<OccurrenceIndexFile | null>(null);
  const [selectedShape, setSelectedShape] = useState<RootShape | null>(null);
  const [scope, setScope] = useUrlParam<Scope>(
    "patternsScope",
    { kind: "quran" },
    scopeFromParam,
    scopeToParam,
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPatterns(), getIndex(), getOccurrenceIndex()]).then(([p, i, o]) => {
      if (!cancelled) {
        setPatterns(p);
        setIndex(i);
        setOccurrences(o);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rootNames = useMemo(() => index?.roots.map((r) => r.ar) ?? [], [index]);

  const scoped = useMemo(() => {
    if (!occurrences || scope.kind === "quran") return null;
    return scopedPatterns(occurrences, scope, rootNames);
  }, [occurrences, scope, rootNames]);

  const verbForms = useMemo(() => {
    if (scoped) return scoped.verbForms.map((f) => ({ form: f.key, ...f }));
    return patterns?.verbForms ?? [];
  }, [scoped, patterns]);
  const categories = useMemo(() => {
    if (scoped) return scoped.categories.map((c) => ({ cat: c.key, ...c }));
    return patterns?.categories ?? [];
  }, [scoped, patterns]);
  const rootShapes = useMemo(() => {
    if (scoped) return scoped.rootShapes.map((s) => ({ shape: s.key, ...s }));
    return patterns?.rootShapes ?? [];
  }, [scoped, patterns]);

  const shapeRoots = useMemo(() => {
    if (!selectedShape) return [];
    if (scoped) {
      return (scoped.shapeRoots.get(selectedShape) ?? []).map((r) => ({
        ar: rootNames[r.rootIdx],
        count: r.count,
      }));
    }
    if (!index) return [];
    return index.roots
      .filter((r) => classifyRootShape(r.ar) === selectedShape)
      .sort((a, b) => b.count - a.count);
  }, [scoped, index, rootNames, selectedShape]);

  const loading = !patterns || !index || !occurrences;

  function buildTable(): ExportTable {
    const scopeLabel = scopeToParam(scope);
    const rows: (string | number)[][] = [
      ...verbForms.map((f) => ["verb_form", ROMAN_FORMS[String(f.form)], f.count, f.rootCount]),
      ...categories.map((c) => ["category", c.cat, c.count, c.rootCount]),
      ...rootShapes.map((s) => ["root_shape", s.shape, s.count, s.rootCount]),
    ];
    return {
      slug: `patterns-${scopeLabel.replace(":", "-")}`,
      meta: {
        title: t.insightsPage.patternsHeading,
        provenance: [
          { label: "scope", value: scopeLabel },
          ...(scope.kind !== "quran"
            ? [
                {
                  label: "note",
                  value:
                    "verb-Form and category counts use each word-form's usual category, not this occurrence's own tag; root shapes are exact",
                },
              ]
            : []),
        ],
      },
      columns: [
        { key: "section", label: "section" },
        { key: "key", label: "key" },
        { key: "count", label: "count" },
        { key: "root_count", label: "root_count" },
      ],
      rows,
    };
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">{t.insightsPage.patternsHeading}</h2>
        <p className="mt-1 text-sm text-muted">{t.insightsPage.patternsDescription}</p>
        <div className="mt-4">
          <ScopeSelector
            scope={scope}
            onChange={setScope}
            meta={meta}
            labels={t.insightsPage.compare}
          />
        </div>
        {scope.kind !== "quran" && (
          <p className="mt-2 text-xs text-muted">{t.insightsPage.patternsScopedNote}</p>
        )}
        {!loading && (
          <div className="mt-3 flex justify-end gap-2">
            <SaveButton
              id={`view:patterns:${scopeToParam(scope)}`}
              kind="view"
              label={t.insightsPage.patternsHeading}
              detail={scopeToParam(scope)}
              href={`/insights/?tab=patterns&patternsScope=${scopeToParam(scope)}`}
              compact
            />
            <ExportButton
              path={`/insights/?tab=patterns&patternsScope=${scopeToParam(scope)}`}
              subject={{ kind: "patterns", label: scopeToParam(scope) }}
              resolve={buildTable}
            />
          </div>
        )}
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.patternsLoading}
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-ink">
              {t.insightsPage.patternsVerbFormsHeading}
            </h3>
            <p className="mt-1 text-xs text-muted">{t.insightsPage.patternsVerbFormsDescription}</p>
            {scope.kind === "quran" && (
              <p className="mt-1 text-xs text-muted/70">{t.insightsPage.patternsDrilldownHint}</p>
            )}
            <div className="mt-4">
              {verbForms.map((row) => (
                <Bar
                  key={row.form}
                  label={t.advancedSearchPage.verbFormShort(ROMAN_FORMS[String(row.form)])}
                  count={row.count}
                  sub={`${t.insightsPage.patternsRootsCount(row.rootCount)} · ${t.insightsPage.patternsLemmasCount(row.lemmaCount)}`}
                  max={Math.max(...verbForms.map((r) => r.count), 1)}
                  href={advancedSearchHref({ verbForms: [row.form] }, scope)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-ink">
              {t.insightsPage.patternsCategoriesHeading}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {t.insightsPage.patternsCategoriesDescription}
            </p>
            {scope.kind === "quran" && (
              <p className="mt-1 text-xs text-muted/70">{t.insightsPage.patternsDrilldownHint}</p>
            )}
            <div className="mt-4">
              {categories.map((row) => (
                <Bar
                  key={row.cat}
                  label={t.categories[row.cat]}
                  count={row.count}
                  sub={t.insightsPage.patternsRootsCount(row.rootCount)}
                  max={Math.max(...categories.map((r) => r.count), 1)}
                  href={advancedSearchHref({ cats: [row.cat] }, scope)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-ink">
              {t.insightsPage.patternsRootShapesHeading}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {t.insightsPage.patternsRootShapesDescription}
            </p>
            <div className="mt-4">
              {rootShapes.map((row) => (
                <Bar
                  key={row.shape}
                  label={t.rootShapes[row.shape]}
                  count={row.count}
                  sub={t.insightsPage.patternsRootsCount(row.rootCount)}
                  max={Math.max(...rootShapes.map((r) => r.count), 1)}
                  active={selectedShape === row.shape}
                  onClick={() =>
                    setSelectedShape((prev) => (prev === row.shape ? null : row.shape))
                  }
                />
              ))}
            </div>

            {selectedShape && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-muted">
                  {t.insightsPage.patternsShapeRootsShown(
                    Math.min(shapeRoots.length, ROOTS_SHOWN),
                    shapeRoots.length,
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {shapeRoots.slice(0, ROOTS_SHOWN).map((r) => (
                    <Link
                      key={r.ar}
                      href={rootHref(r.ar)}
                      className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      {r.ar} <span className="text-muted">{r.count.toLocaleString()}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
