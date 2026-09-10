"use client";

import type { ReactNode } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import type { RootSummary } from "@/lib/root/summary";
import type { SurahDistribution } from "@/lib/root/distribution";
import type { Dict } from "@/lib/i18n/types";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xl font-semibold text-ink sm:text-2xl">{value.toLocaleString()}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function periodLabel(distribution: SurahDistribution, t: Dict): string {
  if (distribution.medinanCount === 0) return t.rootHeader.fullyMeccan;
  if (distribution.meccanCount === 0) return t.rootHeader.fullyMedinan;
  return t.rootHeader.meccanPct(distribution.meccanPct);
}

export function RootHeader({
  summary,
  distribution,
  actions,
}: {
  summary: RootSummary;
  distribution?: SurahDistribution;
  actions?: ReactNode;
}) {
  const t = useT();
  const root = summary.root ?? "";

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{t.rootHeader.rootLabel}</p>
          <p className="arabic-ui mt-1 text-left text-4xl font-semibold tracking-widest text-ink sm:text-5xl">
            {[...root].join(" ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {summary.bw && <p className="font-mono text-sm text-muted">/{summary.bw}/</p>}
          {distribution && summary.total > 0 && (
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
              {periodLabel(distribution, t)}
            </span>
          )}
          {actions}
        </div>
      </div>

      {summary.glossFull && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink">
          <span className="font-medium">{t.rootHeader.meaningLabel}</span>
          {summary.glossFull}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
        <Stat label={t.rootHeader.totalOccurrences} value={summary.total} />
        <Stat label={t.rootHeader.derivedLemmas} value={summary.lemmaCount} />
        <Stat label={t.rootHeader.distinctForms} value={summary.formCount} />
        <Stat label={t.rootHeader.verses} value={summary.verseCount} />
      </div>
    </div>
  );
}
