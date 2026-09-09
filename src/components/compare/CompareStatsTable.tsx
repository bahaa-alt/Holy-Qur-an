import type { RootSummary } from "@/lib/root/summary";

const ROWS: { label: string; key: keyof RootSummary }[] = [
  { label: "Total occurrences", key: "total" },
  { label: "Derived lemmas", key: "lemmaCount" },
  { label: "Distinct forms", key: "formCount" },
  { label: "Verses", key: "verseCount" },
  { label: "Surahs", key: "surahCount" },
];

export function CompareStatsTable({ summaries }: { summaries: RootSummary[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">Stats</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pe-3 font-medium"></th>
              {summaries.map((s) => (
                <th key={s.root} className="arabic-ui py-2 pe-3 text-right text-base font-medium text-ink">
                  {s.root}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ label, key }) => (
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
