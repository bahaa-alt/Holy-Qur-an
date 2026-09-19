"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HighlightedVerse } from "@/components/ayah/HighlightedVerse";
import { AyahActions } from "@/components/ayah/AyahActions";
import { SaveButton } from "@/components/notes/SaveButton";
import { RelatedVerses } from "@/components/ayah/RelatedVerses";
import { ReadingsPanel } from "@/components/readings/ReadingsPanel";
import { TafsirPanel } from "@/components/tafsir/TafsirPanel";
import { CHRONOLOGICAL_ORDER_BY_SURAH } from "@/lib/data/chronologicalOrder";
import { juzForVerse } from "@/lib/quran/juz";
import { hizbForVerse } from "@/lib/quran/hizb";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import type { ManifestReading, SurahMeta, SurahVerse } from "@/lib/data/types";

/**
 * One verse, with everything this app knows about it in one place.
 *
 * Only the identifying material renders statically -- reference, text,
 * translations, metrics, and the reading the text belongs to. Every heavier
 * layer is a lazy panel, which is what keeps 6,236 of these affordable
 * against the deploy's size ceiling (see the route's own comment).
 */
export function VersePageContent({
  s,
  a,
  surahMeta,
  verse,
  reading,
}: {
  s: number;
  a: number;
  surahMeta: SurahMeta;
  verse: SurahVerse;
  reading: ManifestReading;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const Prev = lang === "ar" ? ArrowRight : ArrowLeft;
  const Next = lang === "ar" ? ArrowLeft : ArrowRight;

  const prev = a > 1 ? `${s}:${a - 1}` : s > 1 ? null : null;
  const next = a < surahMeta.ayahs ? `${s}:${a + 1}` : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between text-sm">
        {prev ? (
          <Link
            href={`/v/${prev}/`}
            className="inline-flex items-center gap-1 text-accent hover:text-accent-strong"
          >
            <Prev size={14} /> <bdi>{prev}</bdi>
          </Link>
        ) : (
          <span />
        )}
        <Link href={`/surah/${s}/?ayah=${a}`} className="text-muted hover:text-accent">
          {surahMeta.translit}
        </Link>
        {next ? (
          <Link
            href={`/v/${next}/`}
            className="inline-flex items-center gap-1 text-accent hover:text-accent-strong"
          >
            <bdi>{next}</bdi> <Next size={14} />
          </Link>
        ) : (
          <span />
        )}
      </div>

      <header className="mt-6 text-center">
        <h1 className="text-3xl font-semibold text-ink">
          <bdi>
            {s}:{a}
          </bdi>
        </h1>
        <p className="arabic-ui mt-1 text-lg text-muted">{surahMeta.nameAr}</p>
      </header>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <HighlightedVerse s={s} a={a} tokens={verse.w} highlightIndices={[]} />
        <p className="mt-4 text-sm leading-relaxed text-muted">{verse.t}</p>
        {verse.pickthall && (
          <p className="mt-2 text-sm leading-relaxed text-muted/80">
            <span className="me-1 text-xs uppercase tracking-wide text-muted/60">
              {t.ayahCard.pickthallLabel}
            </span>
            {verse.pickthall}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <AyahActions
            arabic={verse.w.join(" ")}
            translation={verse.t}
            pickthall={verse.pickthall}
            surah={s}
            ayah={a}
          />
          <SaveButton
            id={`verse:${s}:${a}`}
            kind="verse"
            label={`${s}:${a}`}
            href={`/v/${s}:${a}/`}
          />
        </div>
      </div>

      {/* Every layer below loads on click. Nothing here is in the static HTML
          beyond its toggle, which is what makes 6,236 of these affordable. */}
      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-6">
        <TafsirPanel s={s} a={a} />
        <ReadingsPanel s={s} a={a} hafsText={verse.w.join(" ")} />
        <RelatedVerses s={s} a={a} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl border border-border bg-surface p-6 text-sm sm:grid-cols-3">
        <Metric label={t.versePage.words} value={String(verse.w.length)} />
        <Metric
          label={t.versePage.revelation}
          value={surahMeta.type === "meccan" ? t.surahPage.meccan : t.surahPage.medinan}
        />
        <Metric
          label={t.versePage.chronological}
          value={`#${CHRONOLOGICAL_ORDER_BY_SURAH[s - 1]}`}
        />
        <Metric label={t.versePage.juz} value={String(juzForVerse(s, a))} />
        <Metric label={t.versePage.hizb} value={String(hizbForVerse(s, a))} />
        <Metric label={t.versePage.surahLength} value={String(surahMeta.ayahs)} />
      </dl>

      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/about/" className="hover:text-accent">
          {t.surahPage.readingNote(reading.transmission, reading.verseNumbering)}
        </Link>
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted/70">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
