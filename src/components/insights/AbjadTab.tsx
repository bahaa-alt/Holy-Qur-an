"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAbjad } from "@/lib/data/loader";
import { ABJAD_LETTER_ORDER, ABJAD_VALUES } from "@/lib/arabic/abjad";
import { JUZ_COUNT } from "@/lib/quran/juz";
import { HIZB_COUNT } from "@/lib/quran/hizb";
import { AbjadAyahBreakdown } from "./AbjadAyahBreakdown";
import { AbjadReverseLookup } from "./AbjadReverseLookup";
import { useT } from "@/lib/i18n/LanguageContext";
import type { AbjadTotalsFile, MetaFile } from "@/lib/data/types";

type Scope = "ayah" | "surah" | "hizb" | "juz" | "quran";
const SCOPE_PILL_CLASS = (active: boolean) => `rounded-md px-2.5 py-1 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

export function AbjadTab({ meta }: { meta: MetaFile }) {
  const t = useT();
  const [abjad, setAbjad] = useState<AbjadTotalsFile | null>(null);
  const [scope, setScope] = useState<Scope>("quran");
  const [surahNum, setSurahNum] = useState(1);
  const [ayahNum, setAyahNum] = useState(1);
  const [hizbNum, setHizbNum] = useState(1);
  const [juzNum, setJuzNum] = useState(1);
  const [lookupInput, setLookupInput] = useState("");

  function lookUpValue(value: number) {
    setLookupInput(String(value));
    document.getElementById("abjad-lookup")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    let cancelled = false;
    getAbjad().then((a) => {
      if (!cancelled) setAbjad(a);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxAyah = meta.surahs.find((s) => s.n === surahNum)?.ayahs ?? 1;
  const clampedAyah = Math.min(Math.max(1, ayahNum), maxAyah);
  const ayahKey = `${surahNum}-${clampedAyah}`;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.abjadHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.abjadDescription}</p>

      <h3 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">{t.insightsPage.abjadReferenceHeading}</h3>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {ABJAD_LETTER_ORDER.map((letter) => (
          <div key={letter} className="rounded-lg border border-border px-2 py-1.5 text-center">
            <div className="arabic-ui text-base text-ink">{letter}</div>
            <div className="text-xs text-muted">{ABJAD_VALUES[letter]}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap rounded-lg border border-border p-0.5 text-xs">
          <button type="button" onClick={() => setScope("quran")} className={SCOPE_PILL_CLASS(scope === "quran")}>
            {t.insightsPage.scopeQuran}
          </button>
          <button type="button" onClick={() => setScope("juz")} className={SCOPE_PILL_CLASS(scope === "juz")}>
            {t.insightsPage.scopeJuz}
          </button>
          <button type="button" onClick={() => setScope("hizb")} className={SCOPE_PILL_CLASS(scope === "hizb")}>
            {t.insightsPage.scopeHizb}
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

        {scope === "hizb" && (
          <label className="flex items-center gap-2 text-sm text-ink">
            {t.insightsPage.hizbLabel}
            <select
              value={hizbNum}
              onChange={(e) => setHizbNum(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
            >
              {Array.from({ length: HIZB_COUNT }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
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

      {!abjad ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.abjadLoading}
        </p>
      ) : (
        <>
          {scope === "ayah" ? (
            <AbjadAyahBreakdown key={ayahKey} surahNum={surahNum} ayahNum={clampedAyah} onTotalClick={lookUpValue} />
          ) : (
            <p className="mt-4 text-sm text-ink">
              <span className="text-xs uppercase tracking-wide text-muted">{t.insightsPage.abjadTotalLabel}: </span>
              <button
                type="button"
                onClick={() =>
                  lookUpValue(
                    scope === "quran"
                      ? abjad.bookTotal
                      : scope === "surah"
                        ? abjad.bySurah[surahNum - 1]
                        : scope === "hizb"
                          ? abjad.byHizb[hizbNum - 1]
                          : abjad.byJuz[juzNum - 1],
                  )
                }
                className="text-2xl font-semibold hover:text-accent"
              >
                {(scope === "quran"
                  ? abjad.bookTotal
                  : scope === "surah"
                    ? abjad.bySurah[surahNum - 1]
                    : scope === "hizb"
                      ? abjad.byHizb[hizbNum - 1]
                      : abjad.byJuz[juzNum - 1]
                ).toLocaleString()}
              </button>
            </p>
          )}

          <div id="abjad-lookup" className="mt-6">
            <AbjadReverseLookup abjad={abjad} meta={meta} input={lookupInput} onInputChange={setLookupInput} />
          </div>
        </>
      )}
    </div>
  );
}
