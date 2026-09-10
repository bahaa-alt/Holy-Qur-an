"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { rootHref } from "@/lib/search/suggest";
import type { RootSummary } from "@/lib/root/summary";
import type { Dict } from "@/lib/i18n/types";

function rows(t: Dict): { label: string; key: keyof RootSummary }[] {
  return [
    { label: t.compareStatsTable.totalOccurrences, key: "total" },
    { label: t.compareStatsTable.derivedLemmas, key: "lemmaCount" },
    { label: t.compareStatsTable.distinctForms, key: "formCount" },
    { label: t.compareStatsTable.verses, key: "verseCount" },
    { label: t.compareStatsTable.surahs, key: "surahCount" },
  ];
}

export function CompareStatsTable({ summaries }: { summaries: RootSummary[] }) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">{t.compareStatsTable.heading}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pe-3 font-medium"></th>
              {summaries.map((s) => (
                <th key={s.root} className="arabic-ui py-2 pe-3 text-right text-base font-medium text-ink">
                  {s.root ? (
                    <Link href={rootHref(s.root)} className="hover:text-accent">
                      {s.root}
                    </Link>
                  ) : (
                    s.root
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows(t).map(({ label, key }) => (
              <tr key={key} className="border-b border-border/60 last:border-0">
                <td className="py-2 pe-3 text-xs text-muted">{label}</td>
                {summaries.map((s) => (
                  <td key={s.root} className="py-2 pe-3 text-right text-ink">
                    {(s[key] as number).toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
