"use client";

import Link from "next/link";
import { verseHref } from "@/lib/search/suggest";
import { useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import { LetterFrequencyExplorer } from "./LetterFrequencyExplorer";
import { CompareTab } from "./CompareTab";
import { RhymeTab } from "./RhymeTab";
import { CollocationsTab } from "./CollocationsTab";
import { CooccurrenceTab } from "./CooccurrenceTab";
import { PatternsTab } from "./PatternsTab";
import { FormulasTab } from "./FormulasTab";
import { VerseSimilarityTab } from "./VerseSimilarityTab";
import { HapaxList } from "./HapaxList";
import type { InsightsFile, MetaFile } from "@/lib/data/types";

type Tab =
  | "compare"
  | "facts"
  | "letters"
  | "rhyme"
  | "collocations"
  | "cooccurrence"
  | "patterns"
  | "formulas"
  | "verseSimilarity";
const TAB_PILL_CLASS = (active: boolean) =>
  `rounded-md px-3 py-1.5 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

function VerseLink({ s, a, label }: { s: number; a: number; label: string }) {
  return (
    <Link href={verseHref(s, a)} className="text-accent hover:text-accent-strong">
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
      <div className={`mt-1.5 text-ink ${big ? "text-2xl font-semibold" : "text-sm"}`}>
        {children}
      </div>
    </div>
  );
}

export function InsightsPageContent({
  insights,
  meta,
  mostDerivedRootHref,
  mostFormsRootHref,
}: {
  insights: InsightsFile;
  meta: MetaFile;
  mostDerivedRootHref: string;
  mostFormsRootHref: string;
}) {
  const t = useT();
  // Compare opens first: it is the only tab that answers a question of the
  // reader's own rather than showing a number someone chose in advance.
  const [tab, setTab] = useState<Tab>("compare");
  const [expandedHapax, setExpandedHapax] = useState<"root" | "lemma" | null>(null);
  const mostFrequentLetter = insights.letterFrequency[0];
  const leastFrequentLetter = insights.letterFrequency[insights.letterFrequency.length - 1];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.insightsPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.insightsPage.subtitle}</p>
      </div>

      <div className="flex flex-wrap rounded-lg border border-border p-0.5 text-sm">
        <button
          type="button"
          onClick={() => setTab("compare")}
          className={TAB_PILL_CLASS(tab === "compare")}
        >
          {t.insightsPage.compare.tab}
        </button>
        <button
          type="button"
          onClick={() => setTab("facts")}
          className={TAB_PILL_CLASS(tab === "facts")}
        >
          {t.insightsPage.tabFacts}
        </button>
        <button
          type="button"
          onClick={() => setTab("letters")}
          className={TAB_PILL_CLASS(tab === "letters")}
        >
          {t.insightsPage.tabLetters}
        </button>
        <button
          type="button"
          onClick={() => setTab("rhyme")}
          className={TAB_PILL_CLASS(tab === "rhyme")}
        >
          {t.insightsPage.tabRhyme}
        </button>
        <button
          type="button"
          onClick={() => setTab("collocations")}
          className={TAB_PILL_CLASS(tab === "collocations")}
        >
          {t.insightsPage.tabCollocations}
        </button>
        <button
          type="button"
          onClick={() => setTab("cooccurrence")}
          className={TAB_PILL_CLASS(tab === "cooccurrence")}
        >
          {t.insightsPage.tabCooccurrence}
        </button>
        <button
          type="button"
          onClick={() => setTab("patterns")}
          className={TAB_PILL_CLASS(tab === "patterns")}
        >
          {t.insightsPage.tabPatterns}
        </button>
        <button
          type="button"
          onClick={() => setTab("formulas")}
          className={TAB_PILL_CLASS(tab === "formulas")}
        >
          {t.insightsPage.tabFormulas}
        </button>
        <button
          type="button"
          onClick={() => setTab("verseSimilarity")}
          className={TAB_PILL_CLASS(tab === "verseSimilarity")}
        >
          {t.insightsPage.tabVerseSimilarity}
        </button>
      </div>

      {tab === "facts" && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">{t.insightsPage.factsDescription}</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard label={t.insightsPage.longestVerseLabel}>
              <VerseLink
                s={insights.longestVerse.s}
                a={insights.longestVerse.a}
                label={t.insightsPage.wordsCount(insights.longestVerse.wordCount)}
              />
            </StatCard>
            <StatCard label={t.insightsPage.shortestVerseLabel}>
              <VerseLink
                s={insights.shortestVerse.s}
                a={insights.shortestVerse.a}
                label={t.insightsPage.wordsCount(insights.shortestVerse.wordCount)}
              />
            </StatCard>
            <StatCard label={t.insightsPage.longestWordLabel}>
              <Link
                href={verseHref(insights.longestWord.s, insights.longestWord.a)}
                className="text-accent hover:text-accent-strong"
              >
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
                label={t.insightsPage.rootsInVerseCount(
                  insights.mostRootDenseVerse.distinctRootCount,
                  insights.mostRootDenseVerse.wordCount,
                )}
              />
            </StatCard>
            <StatCard label={t.insightsPage.mostFrequentLetterLabel} big>
              {mostFrequentLetter && (
                <button
                  type="button"
                  onClick={() => setTab("letters")}
                  className="flex items-baseline gap-2 hover:text-accent"
                >
                  <span className="arabic-ui">{mostFrequentLetter.letter}</span>
                  <span className="text-xs font-normal text-muted">
                    {mostFrequentLetter.count.toLocaleString()}
                  </span>
                </button>
              )}
            </StatCard>
            <StatCard label={t.insightsPage.leastFrequentLetterLabel} big>
              {leastFrequentLetter && (
                <button
                  type="button"
                  onClick={() => setTab("letters")}
                  className="flex items-baseline gap-2 hover:text-accent"
                >
                  <span className="arabic-ui">{leastFrequentLetter.letter}</span>
                  <span className="text-xs font-normal text-muted">
                    {leastFrequentLetter.count.toLocaleString()}
                  </span>
                </button>
              )}
            </StatCard>
            <StatCard label={t.insightsPage.mostDerivedRootLabel}>
              <Link
                href={mostDerivedRootHref}
                className="arabic-ui text-accent hover:text-accent-strong"
              >
                {insights.mostDerivedRoot.ar}
              </Link>{" "}
              <span className="text-xs text-muted">
                {t.insightsPage.lemmasCount(insights.mostDerivedRoot.lemmaCount)}
              </span>
            </StatCard>
            <StatCard label={t.insightsPage.mostFormsRootLabel}>
              <Link
                href={mostFormsRootHref}
                className="arabic-ui text-accent hover:text-accent-strong"
              >
                {insights.mostFormsRoot.ar}
              </Link>{" "}
              <span className="text-xs text-muted">
                {t.insightsPage.formsCount(insights.mostFormsRoot.formCount)}
              </span>
            </StatCard>
            <StatCard label={t.insightsPage.hapaxRootsLabel} big>
              <button
                type="button"
                onClick={() => setExpandedHapax((prev) => (prev === "root" ? null : "root"))}
                className="block text-start hover:text-accent"
              >
                {insights.hapaxRootCount.toLocaleString()}
                <span className="block text-xs font-normal text-muted">
                  {t.insightsPage.hapaxViewHint}
                </span>
              </button>
            </StatCard>
            <StatCard label={t.insightsPage.hapaxLemmasLabel} big>
              <button
                type="button"
                onClick={() => setExpandedHapax((prev) => (prev === "lemma" ? null : "lemma"))}
                className="block text-start hover:text-accent"
              >
                {insights.hapaxLemmaCount.toLocaleString()}
                <span className="block text-xs font-normal text-muted">
                  {t.insightsPage.hapaxViewHint}
                </span>
              </button>
            </StatCard>
          </div>

          {expandedHapax && (
            <div className="mt-4 border-t border-border pt-4">
              <HapaxList key={expandedHapax} kind={expandedHapax} />
            </div>
          )}
        </div>
      )}

      {tab === "letters" && (
        <LetterFrequencyExplorer meta={meta} wholeQuranFrequency={insights.letterFrequency} />
      )}

      {tab === "compare" && <CompareTab meta={meta} />}
      {tab === "rhyme" && <RhymeTab />}
      {tab === "collocations" && <CollocationsTab />}
      {/* Abjad used to be a tab here. It is not corpus evidence, so it now
          lives on /curiosities/ -- linked, not hidden. */}
      {tab === "facts" && (
        <p className="mt-6 text-sm text-muted">
          <Link href="/curiosities/" className="text-accent hover:text-accent-strong">
            {t.curiositiesPage.linkFromInsights}
          </Link>
        </p>
      )}
      {tab === "cooccurrence" && <CooccurrenceTab />}
      {tab === "patterns" && <PatternsTab />}
      {tab === "formulas" && <FormulasTab />}
      {tab === "verseSimilarity" && <VerseSimilarityTab />}
    </div>
  );
}
