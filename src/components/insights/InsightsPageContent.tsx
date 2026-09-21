"use client";

import Link from "next/link";
import { verseHref } from "@/lib/search/suggest";
import { useState, type ReactNode } from "react";
import { useUrlParam } from "@/lib/hooks/useUrlParam";
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

const ALL_TABS: readonly Tab[] = [
  "compare",
  "facts",
  "letters",
  "rhyme",
  "collocations",
  "cooccurrence",
  "patterns",
  "formulas",
  "verseSimilarity",
];
function parseTab(raw: string | null): Tab | null {
  return raw !== null && (ALL_TABS as readonly string[]).includes(raw) ? (raw as Tab) : null;
}

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
  // Persisted to ?tab= so a link (and a tool's own Save/Export button, one
  // level down) can reopen on the tab it names -- see useUrlParam.
  const [tab, setTab] = useUrlParam<Tab>("tab", "compare", parseTab, (v) => v);
  const [expandedHapax, setExpandedHapax] = useState<"root" | "lemma" | null>(null);
  const mostFrequentLetter = insights.letterFrequency[0];
  const leastFrequentLetter = insights.letterFrequency[insights.letterFrequency.length - 1];

  const tabLabel: Record<Tab, string> = {
    compare: t.insightsPage.compare.tab,
    facts: t.insightsPage.tabFacts,
    letters: t.insightsPage.tabLetters,
    rhyme: t.insightsPage.tabRhyme,
    collocations: t.insightsPage.tabCollocations,
    cooccurrence: t.insightsPage.tabCooccurrence,
    patterns: t.insightsPage.tabPatterns,
    formulas: t.insightsPage.tabFormulas,
    verseSimilarity: t.insightsPage.tabVerseSimilarity,
  };
  // Five research questions instead of nine technique names a first-time
  // reader had to already know the meaning of -- "cooccurrence" and
  // "collocations" read as synonyms until you know which asks about verb
  // government and which asks about root pairs. See groups' doc comment
  // in i18n/types.ts.
  const groups: { label: string; tabs: Tab[] }[] = [
    { label: t.insightsPage.groups.ask, tabs: ["compare"] },
    { label: t.insightsPage.groups.wordsTogether, tabs: ["collocations", "cooccurrence"] },
    {
      label: t.insightsPage.groups.repetitionForm,
      tabs: ["formulas", "verseSimilarity", "patterns"],
    },
    { label: t.insightsPage.groups.sound, tabs: ["letters", "rhyme"] },
    { label: t.insightsPage.groups.facts, tabs: ["facts"] },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.insightsPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.insightsPage.subtitle}</p>
      </div>

      <div className="space-y-1.5 text-sm">
        {groups.map((g) => (
          <div key={g.label} className="flex flex-wrap items-center gap-1.5">
            <span className="min-w-[6.5rem] text-[10px] font-medium uppercase tracking-wide text-muted/70">
              {g.label}
            </span>
            <div className="flex flex-wrap rounded-lg border border-border p-0.5">
              {g.tabs.map((tabName) => (
                <button
                  key={tabName}
                  type="button"
                  onClick={() => setTab(tabName)}
                  className={TAB_PILL_CLASS(tab === tabName)}
                >
                  {tabLabel[tabName]}
                </button>
              ))}
            </div>
          </div>
        ))}
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
      {tab === "rhyme" && <RhymeTab meta={meta} />}
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
      {tab === "cooccurrence" && <CooccurrenceTab meta={meta} />}
      {tab === "patterns" && <PatternsTab />}
      {tab === "formulas" && <FormulasTab meta={meta} />}
      {tab === "verseSimilarity" && <VerseSimilarityTab meta={meta} />}
    </div>
  );
}
