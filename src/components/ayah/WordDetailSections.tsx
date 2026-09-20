"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { LaneEntry } from "@/components/lane/LaneEntry";
import { MujamEntry } from "@/components/mujam/MujamEntry";
import { rootHref } from "@/lib/search/suggest";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import {
  CASE_LABELS,
  DEFINITENESS_LABELS,
  MOOD_LABELS,
  pgnLabel,
  type FeatureLabel,
} from "@/lib/morphology/featureLabels";
import { G2_CRITICAL } from "@/lib/stats/keyness";
import type { SegmentFeatures, WordDetail } from "@/lib/word/wordDetail";

/**
 * The deeper half of the word inspector: what the corpus marks on this
 * word, what the lexicons say about its root, and whether the root is
 * characteristic of the surah being read.
 *
 * Split out of WordInfoPanel because it renders later (see that file) and
 * because it is where the panel stopped being a summary and became the
 * reason not to leave the verse.
 */

const WORK_TITLES: Record<string, { en: string; ar: string }> = {
  lane: { en: "Lane's Lexicon", ar: "معجم لين" },
  maqayis: { en: "Maqāyīs al-Lugha", ar: "مقاييس اللغة" },
  mufradat: { en: "Mufradāt al-Qurʾān", ar: "مفردات القرآن" },
  sihah: { en: "al-Ṣiḥāḥ", ar: "الصحاح" },
};

function FeatureChip({ label, value }: { label: string; value: FeatureLabel | undefined }) {
  const { lang } = useLanguage();
  if (!value) return null;
  return (
    <span className="inline-flex items-baseline gap-1 rounded-full border border-border px-2 py-0.5 text-xs">
      <span className="text-muted">{label}</span>
      <span className={lang === "ar" ? "arabic-ui text-ink" : "text-ink"}>
        {lang === "ar" ? value.ar : value.en}
      </span>
    </span>
  );
}

function SegmentRow({ row }: { row: SegmentFeatures }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-muted/70">{t.wordInfoPanel.segmentLabel(row.g)}</span>
      <FeatureChip
        label={t.wordInfoPanel.caseLabel}
        value={row.case ? CASE_LABELS[row.case] : undefined}
      />
      <FeatureChip
        label={t.wordInfoPanel.moodLabel}
        value={row.mood ? MOOD_LABELS[row.mood] : undefined}
      />
      <FeatureChip
        label={t.wordInfoPanel.definitenessLabel}
        value={row.definiteness ? DEFINITENESS_LABELS[row.definiteness] : undefined}
      />
      <FeatureChip
        label={t.wordInfoPanel.agreementLabel}
        value={row.pgn ? pgnLabel(row.pgn) : undefined}
      />
    </div>
  );
}

export function WordDetailSections({
  detail,
  surah,
  root,
}: {
  detail: WordDetail | null;
  surah: number;
  root: string;
}) {
  const t = useT();
  const { lang } = useLanguage();

  if (detail === null) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted">
        <Loader2 size={12} className="animate-spin" />
      </p>
    );
  }

  const k = detail.surahKeyness;
  // The ratio a reader can actually picture, from the effect size the
  // Compare tool reports: log ratio is in doublings, so 2^|lr| is "this
  // many times as frequent".
  const times = k ? Math.pow(2, Math.abs(k.logRatio)).toFixed(1) : "";
  const significant = k !== null && k.g2 >= G2_CRITICAL.p05;

  return (
    <div className="space-y-3 border-t border-border/60 pt-2">
      {detail.features.length > 0 && (
        <div>
          <span className="text-xs uppercase tracking-wide text-muted">
            {t.wordInfoPanel.features}
          </span>
          <div className="mt-1 space-y-1">
            {detail.features.map((row) => (
              <SegmentRow key={row.g} row={row} />
            ))}
          </div>
        </div>
      )}

      {k !== null && (
        <div>
          <span className="text-xs uppercase tracking-wide text-muted">
            {t.wordInfoPanel.keynessHeading}
          </span>{" "}
          <span className="text-xs text-ink">
            {/* Under a doubling either way is not worth a sentence about
                over-use; say it is ordinary and move on. */}
            {Math.abs(k.logRatio) < 1
              ? t.wordInfoPanel.keynessFlat
              : k.overused
                ? t.wordInfoPanel.keynessOver(times, k.g2.toFixed(0))
                : t.wordInfoPanel.keynessUnder(times, k.g2.toFixed(0))}
            {!significant && (
              <span className="text-muted"> — {t.wordInfoPanel.keynessNotSignificant}</span>
            )}
          </span>{" "}
          <Link
            href={`/insights/?scope=surah:${surah}`}
            className="whitespace-nowrap text-xs text-accent hover:text-accent-strong"
          >
            {t.wordInfoPanel.compareInInsights} →
          </Link>
        </div>
      )}

      {detail.lexicons.length > 0 && (
        <div>
          <span className="text-xs uppercase tracking-wide text-muted">
            {t.wordInfoPanel.lexicons}
          </span>
          <div className="mt-1 space-y-2">
            {detail.lexicons.map((entry) => {
              const title = WORK_TITLES[entry.work];
              return (
                <div key={entry.work} className="rounded-lg border border-border/60 p-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[11px] text-muted">
                      {title ? (lang === "ar" ? title.ar : title.en) : entry.work}
                    </span>
                    <span className="arabic-ui text-xs text-muted" dir="rtl">
                      {entry.headword}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-4 text-xs">
                    {/* Lane's articles are English prose with Arabic spans;
                        the Arabic lexicons are Arabic throughout. Each has
                        its own renderer already, and both refuse innerHTML. */}
                    {entry.work === "lane" ? (
                      <LaneEntry tokens={entry.tokens} />
                    ) : (
                      <MujamEntry tokens={entry.tokens} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href={`${rootHref(root)}#lexicon`}
            className="mt-1 inline-block text-xs text-accent hover:text-accent-strong"
          >
            {t.wordInfoPanel.lexiconMore} →
          </Link>
        </div>
      )}
    </div>
  );
}
