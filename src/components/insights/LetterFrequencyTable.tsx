"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import type { LetterCount } from "@/lib/arabic/letterFrequency";

export function LetterFrequencyTable({ rows }: { rows: LetterCount[] }) {
  const t = useT();
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-muted">{t.insightsPage.noLetters}</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[360px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-2 py-1.5 text-start">{t.insightsPage.letterColumn}</th>
            <th className="px-2 py-1.5 text-start">{t.insightsPage.countColumn}</th>
            <th className="px-2 py-1.5 text-start">{t.insightsPage.shareColumn}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pct = (r.count / total) * 100;
            return (
              <tr key={r.letter} className="border-b border-border/60 last:border-b-0">
                <td className="arabic-ui px-2 py-1.5 text-lg text-ink">{r.letter}</td>
                <td className="px-2 py-1.5 text-ink">{r.count.toLocaleString()}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 shrink-0 rounded-full bg-bg">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted">{pct.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
