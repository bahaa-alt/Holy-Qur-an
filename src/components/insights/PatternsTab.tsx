"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getPatterns } from "@/lib/data/loader";
import { ROMAN_FORMS } from "@/lib/morphology/classify";
import { useT } from "@/lib/i18n/LanguageContext";
import type { PatternsFile } from "@/lib/data/types";

function Bar({ label, count, sub, max }: { label: string; count: number; sub: string; max: number }) {
  const pct = Math.max((count / max) * 100, 2);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-28 shrink-0 text-sm text-ink">{label}</div>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-40 shrink-0 text-end text-xs text-muted">
        {count.toLocaleString()} <span className="text-muted/70">· {sub}</span>
      </div>
    </div>
  );
}

export function PatternsTab() {
  const t = useT();
  const [patterns, setPatterns] = useState<PatternsFile | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPatterns().then((p) => {
      if (!cancelled) setPatterns(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">{t.insightsPage.patternsHeading}</h2>
        <p className="mt-1 text-sm text-muted">{t.insightsPage.patternsDescription}</p>
      </div>

      {!patterns ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.patternsLoading}
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-ink">{t.insightsPage.patternsVerbFormsHeading}</h3>
            <p className="mt-1 text-xs text-muted">{t.insightsPage.patternsVerbFormsDescription}</p>
            <div className="mt-4">
              {patterns.verbForms.map((row) => (
                <Bar
                  key={row.form}
                  label={t.advancedSearchPage.verbFormShort(ROMAN_FORMS[String(row.form)])}
                  count={row.count}
                  sub={`${t.insightsPage.patternsRootsCount(row.rootCount)} · ${t.insightsPage.patternsLemmasCount(row.lemmaCount)}`}
                  max={Math.max(...patterns.verbForms.map((r) => r.count))}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-ink">{t.insightsPage.patternsCategoriesHeading}</h3>
            <p className="mt-1 text-xs text-muted">{t.insightsPage.patternsCategoriesDescription}</p>
            <div className="mt-4">
              {patterns.categories.map((row) => (
                <Bar
                  key={row.cat}
                  label={t.categories[row.cat]}
                  count={row.count}
                  sub={t.insightsPage.patternsRootsCount(row.rootCount)}
                  max={Math.max(...patterns.categories.map((r) => r.count))}
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
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
