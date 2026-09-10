"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { wordHref } from "@/lib/search/suggest";
import type { RootFormEntry, RootLemmaEntry } from "@/lib/data/types";

export function FormsTable({ forms, lemmas }: { forms: RootFormEntry[]; lemmas: RootLemmaEntry[] }) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">{t.formsTable.heading}</h2>
      <p className="mt-1 text-xs text-muted">{t.formsTable.subtitle}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pe-3 font-medium">{t.formsTable.colForm}</th>
              <th className="py-2 pe-3 font-medium">{t.formsTable.colLemma}</th>
              <th className="py-2 pe-3 font-medium">{t.formsTable.colCategory}</th>
              <th className="py-2 text-right font-medium">{t.formsTable.colCount}</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => {
              const lemma = lemmas[f.lemmaIdx];
              return (
                <tr key={f.key + f.form} className="border-b border-border/60 last:border-0">
                  <td className="arabic-ui py-2 pe-3 text-base text-ink">{f.form}</td>
                  <td className="arabic-ui py-2 pe-3 text-muted">
                    {lemma ? (
                      <Link href={wordHref(lemma.wordIdx)} className="hover:text-accent">
                        {lemma.lemma}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 pe-3 text-xs text-muted">{t.categories[f.cat]}</td>
                  <td className="py-2 text-right text-ink">{f.count.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
