"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getDistinctiveVocab } from "@/lib/data/loader";
import { rootHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { DistinctiveRootRow, DistinctiveVocabFile, MetaFile } from "@/lib/data/types";

function Bar({ row, max }: { row: DistinctiveRootRow; max: number }) {
  const t = useT();
  const pct = Math.max((row.ratio / max) * 100, 2);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Link href={rootHref(row.ar)} className="arabic-ui w-24 shrink-0 truncate text-sm text-accent hover:text-accent-strong">
        {row.ar}
      </Link>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-20 shrink-0 text-end text-xs text-muted">
        <div className="font-medium text-ink">{t.insightsPage.vocabRatio(row.ratio.toFixed(1))}</div>
        <div>{row.localCount}</div>
      </div>
    </div>
  );
}

export function DistinctiveVocabTab({ meta }: { meta: MetaFile }) {
  const t = useT();
  const [data, setData] = useState<DistinctiveVocabFile | null>(null);
  const [surahNum, setSurahNum] = useState(12); // default to Surah Yusuf, a good illustrative example

  useEffect(() => {
    let cancelled = false;
    getDistinctiveVocab().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = data?.bySurah[surahNum - 1] ?? [];
  const max = rows.length > 0 ? rows[0].ratio : 1;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.vocabHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.vocabDescription}</p>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink">
        {t.insightsPage.vocabSurahLabel}
        <select
          value={surahNum}
          onChange={(e) => setSurahNum(Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
        >
          {meta.surahs.map((s) => (
            <option key={s.n} value={s.n}>
              {s.n}. {s.nameEn}
            </option>
          ))}
        </select>
      </label>

      {!data ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.vocabLoading}
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.insightsPage.vocabNoResults}</p>
      ) : (
        <div className="mt-4">
          {rows.map((row) => (
            <Bar key={row.ar} row={row} max={max} />
          ))}
        </div>
      )}
    </div>
  );
}
