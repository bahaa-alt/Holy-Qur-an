"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import { JUZ_COUNT } from "@/lib/quran/juz";
import { LetterFrequencyTable } from "./LetterFrequencyTable";
import { LetterFrequencyResult } from "./LetterFrequencyResult";
import type { LetterCount } from "@/lib/arabic/letterFrequency";
import type { MetaFile } from "@/lib/data/types";

type Scope = "quran" | "surah" | "juz" | "ayah";

const SCOPE_PILL_CLASS = (active: boolean) => `rounded-md px-2.5 py-1 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

export function LetterFrequencyExplorer({
  meta,
  wholeQuranFrequency,
}: {
  meta: MetaFile;
  wholeQuranFrequency: LetterCount[];
}) {
  const t = useT();
  const [scope, setScope] = useState<Scope>("quran");
  const [surahNum, setSurahNum] = useState(1);
  const [ayahNum, setAyahNum] = useState(1);
  const [juzNum, setJuzNum] = useState(1);

  const maxAyah = meta.surahs.find((s) => s.n === surahNum)?.ayahs ?? 1;
  const clampedAyah = Math.min(Math.max(1, ayahNum), maxAyah);
  const resultKey =
    scope === "ayah"
      ? `ayah-${surahNum}-${clampedAyah}`
      : scope === "surah"
        ? `surah-${surahNum}`
        : scope === "juz"
          ? `juz-${juzNum}`
          : "quran";

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.letterFrequencyHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.letterFrequencyDescription}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap rounded-lg border border-border p-0.5 text-xs">
          <button type="button" onClick={() => setScope("quran")} className={SCOPE_PILL_CLASS(scope === "quran")}>
            {t.insightsPage.scopeQuran}
          </button>
          <button type="button" onClick={() => setScope("juz")} className={SCOPE_PILL_CLASS(scope === "juz")}>
            {t.insightsPage.scopeJuz}
          </button>
          <button type="button" onClick={() => setScope("surah")} className={SCOPE_PILL_CLASS(scope === "surah")}>
            {t.insightsPage.scopeSurah}
          </button>
          <button type="button" onClick={() => setScope("ayah")} className={SCOPE_PILL_CLASS(scope === "ayah")}>
            {t.insightsPage.scopeAyah}
          </button>
        </div>

        {(scope === "surah" || scope === "ayah") && (
          <label className="flex items-center gap-2 text-sm text-ink">
            {t.insightsPage.surahLabel}
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
        )}

        {scope === "ayah" && (
          <label className="flex items-center gap-2 text-sm text-ink">
            {t.insightsPage.ayahLabel}
            <input
              type="number"
              min={1}
              max={maxAyah}
              value={clampedAyah}
              onChange={(e) => setAyahNum(Number(e.target.value) || 1)}
              className="w-20 rounded-lg border border-border px-2 py-1 text-sm text-ink focus:outline-none"
            />
          </label>
        )}

        {scope === "juz" && (
          <label className="flex items-center gap-2 text-sm text-ink">
            {t.insightsPage.juzLabel}
            <select
              value={juzNum}
              onChange={(e) => setJuzNum(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
            >
              {Array.from({ length: JUZ_COUNT }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {scope === "quran" ? (
        <LetterFrequencyTable rows={wholeQuranFrequency} />
      ) : (
        <LetterFrequencyResult key={resultKey} scope={scope} surahNum={surahNum} ayahNum={clampedAyah} juzNum={juzNum} />
      )}
    </div>
  );
}
