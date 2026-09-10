"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import { LetterFrequencyExplorer } from "./LetterFrequencyExplorer";
import type {
  InsightsFile,
  MetaFile,
  SurahCoverageLemmaRow,
  SurahCoverageRootRow,
} from "@/lib/data/types";

interface RootCoverageRow extends SurahCoverageRootRow {
  href: string;
}
interface LemmaCoverageRow extends SurahCoverageLemmaRow {
  href: string | null;
}

function VerseLink({ s, a, label }: { s: number; a: number; label: string }) {
  return (
    <Link href={`/surah/${s}/?ayah=${a}`} className="text-accent hover:text-accent-strong">
      <bdi>
        {s}:{a}
      </bdi>{" "}
      · {label}
    </Link>
  );
}

function StatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1.5 text-sm text-ink">{children}</div>
    </div>
  );
}

export function InsightsPageContent({
  insights,
  meta,
  rootsBySurahCoverage,
  lemmasBySurahCoverage,
  mostDerivedRootHref,
  mostFormsRootHref,
}: {
  insights: InsightsFile;
  meta: MetaFile;
  rootsBySurahCoverage: RootCoverageRow[];
  lemmasBySurahCoverage: LemmaCoverageRow[];
  mostDerivedRootHref: string;
  mostFormsRootHref: string;
}) {
  const t = useT();
  const mostFrequentLetter = insights.letterFrequency[0];
  const leastFrequentLetter = insights.letterFrequency[insights.letterFrequency.length - 1];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.insightsPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.insightsPage.subtitle}</p>
      </div>

      <LetterFrequencyExplorer meta={meta} wholeQuranFrequency={insights.letterFrequency} />

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">{t.insightsPage.factsHeading}</h2>
        <p className="mt-1 text-sm text-muted">{t.insightsPage.factsDescription}</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard label={t.insightsPage.longestVerseLabel}>
            <VerseLink s={insights.longestVerse.s} a={insights.longestVerse.a} label={t.insightsPage.wordsCount(insights.longestVerse.wordCount)} />
          </StatCard>
          <StatCard label={t.insightsPage.shortestVerseLabel}>
            <VerseLink s={insights.shortestVerse.s} a={insights.shortestVerse.a} label={t.insightsPage.wordsCount(insights.shortestVerse.wordCount)} />
          </StatCard>
          <StatCard label={t.insightsPage.longestWordLabel}>
            <Link href={`/surah/${insights.longestWord.s}/?ayah=${insights.longestWord.a}`} className="text-accent hover:text-accent-strong">
              <span className="arabic-ui text-base">{insights.longestWord.text}</span>
            </Link>
            <span className="ms-2 text-xs text-muted">
              {t.insightsPage.lettersCount(insights.longestWord.letterCount)} ·{" "}
              <bdi>
                {insights.longestWord.s}:{insights.longestWord.a}
              </bdi>
            </span>
          </StatCard>
          <StatCard label={t.insightsPage.mostRootDenseVerseLabel}>
            <VerseLink
              s={insights.mostRootDenseVerse.s}
              a={insights.mostRootDenseVerse.a}
              label={t.insightsPage.rootsInVerseCount(insights.mostRootDenseVerse.distinctRootCount)}
            />
          </StatCard>
          <StatCard label={t.insightsPage.mostFrequentLetterLabel}>
            {mostFrequentLetter && (
              <span>
                <span className="arabic-ui text-lg">{mostFrequentLetter.letter}</span>{" "}
                <span className="text-xs text-muted">{mostFrequentLetter.count.toLocaleString()}</span>
              </span>
            )}
          </StatCard>
          <StatCard label={t.insightsPage.leastFrequentLetterLabel}>
            {leastFrequentLetter && (
              <span>
                <span className="arabic-ui text-lg">{leastFrequentLetter.letter}</span>{" "}
                <span className="text-xs text-muted">{leastFrequentLetter.count.toLocaleString()}</span>
              </span>
            )}
          </StatCard>
          <StatCard label={t.insightsPage.mostDerivedRootLabel}>
            <Link href={mostDerivedRootHref} className="arabic-ui text-accent hover:text-accent-strong">
              {insights.mostDerivedRoot.ar}
            </Link>{" "}
            <span className="text-xs text-muted">{t.insightsPage.lemmasCount(insights.mostDerivedRoot.lemmaCount)}</span>
          </StatCard>
          <StatCard label={t.insightsPage.mostFormsRootLabel}>
            <Link href={mostFormsRootHref} className="arabic-ui text-accent hover:text-accent-strong">
              {insights.mostFormsRoot.ar}
            </Link>{" "}
            <span className="text-xs text-muted">{t.insightsPage.formsCount(insights.mostFormsRoot.formCount)}</span>
          </StatCard>
          <StatCard label={t.insightsPage.hapaxRootsLabel}>{insights.hapaxRootCount.toLocaleString()}</StatCard>
          <StatCard label={t.insightsPage.hapaxLemmasLabel}>{insights.hapaxLemmaCount.toLocaleString()}</StatCard>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-medium text-ink">{t.insightsPage.rootsCoverageHeading}</h2>
        <p className="mt-1 text-xs text-muted">{t.insightsPage.rootsCoverageDescription}</p>
        <div className="mt-3 divide-y divide-border/60">
          {rootsBySurahCoverage.map((row) => (
            <div key={row.ar} className="flex items-center justify-between gap-3 py-2 text-sm">
              <Link href={row.href} className="arabic-ui text-accent hover:text-accent-strong">
                {row.ar}
              </Link>
              <span className="flex items-center gap-2 text-xs text-muted">
                {row.surahCount === insights.totalSurahs && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">{t.insightsPage.everySurahBadge}</span>
                )}
                {t.insightsPage.surahCoverage(row.surahCount, insights.totalSurahs)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-medium text-ink">{t.insightsPage.lemmasCoverageHeading}</h2>
        <p className="mt-1 text-xs text-muted">{t.insightsPage.lemmasCoverageDescription}</p>
        <div className="mt-3 divide-y divide-border/60">
          {lemmasBySurahCoverage.map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
              {row.href ? (
                <Link href={row.href} className="arabic-ui text-accent hover:text-accent-strong">
                  {row.lemma}
                </Link>
              ) : (
                <span className="arabic-ui text-ink">{row.lemma}</span>
              )}
              <span className="flex items-center gap-2 text-xs text-muted">
                {row.surahCount === insights.totalSurahs && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">{t.insightsPage.everySurahBadge}</span>
                )}
                {t.insightsPage.surahCoverage(row.surahCount, insights.totalSurahs)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
