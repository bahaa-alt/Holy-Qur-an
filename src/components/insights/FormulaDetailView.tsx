"use client";

import Link from "next/link";
import { AyahCard } from "@/components/ayah/AyahCard";
import { useT } from "@/lib/i18n/LanguageContext";
import type { FormulaRow, SurahMeta } from "@/lib/data/types";

export interface FormulaOccurrence {
  surahMeta: SurahMeta;
  ayah: number;
  tokens: string[];
  translation: string;
  pickthall?: string;
  highlightIndices: number[];
}

export function FormulaDetailView({
  length,
  row,
  occurrences,
}: {
  length: number;
  row: FormulaRow;
  occurrences: FormulaOccurrence[];
}) {
  const t = useT();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link href="/insights/" className="text-sm text-accent hover:text-accent-strong">
          {t.formulaDetailPage.backToInsights}
        </Link>
        <h1 className="arabic-ui mt-3 text-2xl font-semibold text-ink" dir="rtl">
          {row.display}
        </h1>
        <p className="mt-1 text-sm text-muted">{t.formulaDetailPage.summary(length, row.count)}</p>
      </div>

      <div className="space-y-4">
        {occurrences.map((o) => (
          <AyahCard
            key={`${o.surahMeta.n}:${o.ayah}`}
            surahMeta={o.surahMeta}
            ayah={o.ayah}
            tokens={o.tokens}
            translation={o.translation}
            pickthall={o.pickthall}
            highlightIndices={o.highlightIndices}
          />
        ))}
      </div>
    </div>
  );
}
