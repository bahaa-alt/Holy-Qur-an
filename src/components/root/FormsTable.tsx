import { CATEGORY_LABELS } from "@/lib/data/types";
import type { RootFormEntry, RootLemmaEntry } from "@/lib/data/types";

export function FormsTable({ forms, lemmas }: { forms: RootFormEntry[]; lemmas: RootLemmaEntry[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">Associated words &amp; derivatives</h2>
      <p className="mt-1 text-xs text-muted">Every distinct form derived from this root, with its lemma and count.</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pe-3 font-medium">Form</th>
              <th className="py-2 pe-3 font-medium">Lemma</th>
              <th className="py-2 pe-3 font-medium">Category</th>
              <th className="py-2 text-right font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f.key + f.form} className="border-b border-border/60 last:border-0">
                <td className="arabic-ui py-2 pe-3 text-base text-ink">{f.form}</td>
                <td className="arabic-ui py-2 pe-3 text-muted">{lemmas[f.lemmaIdx]?.lemma ?? "—"}</td>
                <td className="py-2 pe-3 text-xs text-muted">{CATEGORY_LABELS[f.cat]}</td>
                <td className="py-2 text-right text-ink">{f.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
