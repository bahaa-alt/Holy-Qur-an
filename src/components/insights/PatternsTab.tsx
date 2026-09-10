"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getIndex, getPatterns } from "@/lib/data/loader";
import { ROMAN_FORMS } from "@/lib/morphology/classify";
import { classifyRootShape, type RootShape } from "@/lib/morphology/rootShape";
import { rootHref } from "@/lib/search/suggest";
import { encodeAdvancedSearchQuery } from "@/lib/search/advancedSearchQuery";
import { useT } from "@/lib/i18n/LanguageContext";
import type { Cat, IndexFile, IndexRootRow, PatternsFile } from "@/lib/data/types";

const ROOTS_SHOWN = 40;

function advancedSearchHref(partial: { cats?: Cat[]; verbForms?: number[] }): string {
  const query = encodeAdvancedSearchQuery({
    cats: partial.cats ?? [],
    verbForms: partial.verbForms ?? [],
    revelation: "all",
    rootArs: [],
    surahFrom: 1,
    surahTo: 114,
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
  href?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const pct = Math.max((count / max) * 100, 2);
  const content = (
    <div className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${active ? "bg-accent/10" : "hover:bg-bg"}`}>
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
  return (
    <button type="button" onClick={onClick} className="block w-full text-start">
      {content}
    </button>
  );
}

export function PatternsTab() {
  const t = useT();
  const [patterns, setPatterns] = useState<PatternsFile | null>(null);
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [selectedShape, setSelectedShape] = useState<RootShape | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPatterns(), getIndex()]).then(([p, i]) => {
      if (!cancelled) {
        setPatterns(p);
        setIndex(i);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shapeRoots = useMemo(() => {
    if (!index || !selectedShape) return [];
    return index.roots.filter((r) => classifyRootShape(r.ar) === selectedShape).sort((a, b) => b.count - a.count);
  }, [index, selectedShape]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">{t.insightsPage.patternsHeading}</h2>
        <p className="mt-1 text-sm text-muted">{t.insightsPage.patternsDescription}</p>
      </div>

      {!patterns || !index ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.patternsLoading}
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-ink">{t.insightsPage.patternsVerbFormsHeading}</h3>
            <p className="mt-1 text-xs text-muted">{t.insightsPage.patternsVerbFormsDescription}</p>
            <p className="mt-1 text-xs text-muted/70">{t.insightsPage.patternsDrilldownHint}</p>
            <div className="mt-4">
              {patterns.verbForms.map((row) => (
                <Bar
                  key={row.form}
                  label={t.advancedSearchPage.verbFormShort(ROMAN_FORMS[String(row.form)])}
                  count={row.count}
                  sub={`${t.insightsPage.patternsRootsCount(row.rootCount)} · ${t.insightsPage.patternsLemmasCount(row.lemmaCount)}`}
                  max={Math.max(...patterns.verbForms.map((r) => r.count))}
                  href={advancedSearchHref({ verbForms: [row.form] })}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-ink">{t.insightsPage.patternsCategoriesHeading}</h3>
            <p className="mt-1 text-xs text-muted">{t.insightsPage.patternsCategoriesDescription}</p>
            <p className="mt-1 text-xs text-muted/70">{t.insightsPage.patternsDrilldownHint}</p>
            <div className="mt-4">
              {patterns.categories.map((row) => (
                <Bar
                  key={row.cat}
                  label={t.categories[row.cat]}
                  count={row.count}
                  sub={t.insightsPage.patternsRootsCount(row.rootCount)}
                  max={Math.max(...patterns.categories.map((r) => r.count))}
                  href={advancedSearchHref({ cats: [row.cat] })}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-ink">{t.insightsPage.patternsRootShapesHeading}</h3>
            <p className="mt-1 text-xs text-muted">{t.insightsPage.patternsRootShapesDescription}</p>
            <div className="mt-4">
              {patterns.rootShapes.map((row) => (
                <Bar
                  key={row.shape}
                  label={t.rootShapes[row.shape]}
                  count={row.count}
                  sub={t.insightsPage.patternsRootsCount(row.rootCount)}
                  max={Math.max(...patterns.rootShapes.map((r) => r.count))}
                  active={selectedShape === row.shape}
                  onClick={() => setSelectedShape((prev) => (prev === row.shape ? null : row.shape))}
                />
              ))}
            </div>

            {selectedShape && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-muted">
                  {t.insightsPage.patternsShapeRootsShown(Math.min(shapeRoots.length, ROOTS_SHOWN), shapeRoots.length)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {shapeRoots.slice(0, ROOTS_SHOWN).map((r: IndexRootRow) => (
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
