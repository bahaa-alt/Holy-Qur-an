"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import { LetterFrequencyExplorer } from "./LetterFrequencyExplorer";
import { CoverageBarList } from "./CoverageBarList";
import { RhymeTab } from "./RhymeTab";
import { DistinctiveVocabTab } from "./DistinctiveVocabTab";
import { CollocationsTab } from "./CollocationsTab";
import { AbjadTab } from "./AbjadTab";
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

type Tab = "facts" | "letters" | "coverage" | "rhyme" | "vocabulary" | "collocations" | "abjad";
const TAB_PILL_CLASS = (active: boolean) => `rounded-md px-3 py-1.5 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

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

function StatCard({ label, children, big }: { label: string; children: ReactNode; big?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <div className={`mt-1.5 text-ink ${big ? "text-2xl font-semibold" : "text-sm"}`}>{children}</div>
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
  const [tab, setTab] = useState<Tab>("facts");
  const mostFrequentLetter = insights.letterFrequency[0];
  const leastFrequentLetter = insights.letterFrequency[insights.letterFrequency.length - 1];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.insightsPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.insightsPage.subtitle}</p>
      </div>

      <div className="flex flex-wrap rounded-lg border border-border p-0.5 text-sm">
        <button type="button" onClick={() => setTab("facts")} className={TAB_PILL_CLASS(tab === "facts")}>
          {t.insightsPage.tabFacts}
        </button>
        <button type="button" onClick={() => setTab("letters")} className={TAB_PILL_CLASS(tab === "letters")}>
          {t.insightsPage.tabLetters}
        </button>
        <button type="button" onClick={() => setTab("coverage")} className={TAB_PILL_CLASS(tab === "coverage")}>
          {t.insightsPage.tabCoverage}
        </button>
        <button type="button" onClick={() => setTab("rhyme")} className={TAB_PILL_CLASS(tab === "rhyme")}>
          {t.insightsPage.tabRhyme}
        </button>
        <button type="button" onClick={() => setTab("vocabulary")} className={TAB_PILL_CLASS(tab === "vocabulary")}>
          {t.insightsPage.tabVocabulary}
        </button>
        <button type="button" onClick={() => setTab("collocations")} className={TAB_PILL_CLASS(tab === "collocations")}>
          {t.insightsPage.tabCollocations}
        </button>
        <button type="button" onClick={() => setTab("abjad")} className={TAB_PILL_CLASS(tab === "abjad")}>
          {t.insightsPage.tabAbjad}
        </button>
      </div>

      {tab === "facts" && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">{t.insightsPage.factsDescription}</p>

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
                label={t.insightsPage.rootsInVerseCount(insights.mostRootDenseVerse.distinctRootCount, insights.mostRootDenseVerse.wordCount)}
              />
            </StatCard>
            <StatCard label={t.insightsPage.mostFrequentLetterLabel} big>
              {mostFrequentLetter && (
                <span className="flex items-baseline gap-2">
                  <span className="arabic-ui">{mostFrequentLetter.letter}</span>
                  <span className="text-xs font-normal text-muted">{mostFrequentLetter.count.toLocaleString()}</span>
                </span>
              )}
            </StatCard>
            <StatCard label={t.insightsPage.leastFrequentLetterLabel} big>
              {leastFrequentLetter && (
                <span className="flex items-baseline gap-2">
                  <span className="arabic-ui">{leastFrequentLetter.letter}</span>
                  <span className="text-xs font-normal text-muted">{leastFrequentLetter.count.toLocaleString()}</span>
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
            <StatCard label={t.insightsPage.hapaxRootsLabel} big>
              {insights.hapaxRootCount.toLocaleString()}
            </StatCard>
            <StatCard label={t.insightsPage.hapaxLemmasLabel} big>
              {insights.hapaxLemmaCount.toLocaleString()}
            </StatCard>
          </div>
        </div>
      )}

      {tab === "letters" && <LetterFrequencyExplorer meta={meta} wholeQuranFrequency={insights.letterFrequency} />}

      {tab === "coverage" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-sm font-medium text-ink">{t.insightsPage.rootsCoverageHeading}</h2>
            <p className="mt-1 text-xs text-muted">{t.insightsPage.rootsCoverageDescription}</p>
            <CoverageBarList
              rows={rootsBySurahCoverage.map((r) => ({ key: r.ar, href: r.href, label: r.ar, surahCount: r.surahCount }))}
              totalSurahs={insights.totalSurahs}
              everySurahBadge={t.insightsPage.everySurahBadge}
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-sm font-medium text-ink">{t.insightsPage.lemmasCoverageHeading}</h2>
            <p className="mt-1 text-xs text-muted">{t.insightsPage.lemmasCoverageDescription}</p>
            <CoverageBarList
              rows={lemmasBySurahCoverage.map((r, i) => ({ key: String(i), href: r.href, label: r.lemma, surahCount: r.surahCount }))}
              totalSurahs={insights.totalSurahs}
              everySurahBadge={t.insightsPage.everySurahBadge}
            />
          </div>
        </div>
      )}

      {tab === "rhyme" && <RhymeTab />}
      {tab === "vocabulary" && <DistinctiveVocabTab meta={meta} />}
      {tab === "collocations" && <CollocationsTab />}
      {tab === "abjad" && <AbjadTab meta={meta} />}
    </div>
  );
}
