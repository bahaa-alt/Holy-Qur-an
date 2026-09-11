"use client";

import { useState } from "react";
import { DIVINE_NAME_TOPICS } from "@/lib/topics/topicDefinitions";
import { TopicSection } from "@/components/topics/TopicSection";
import { NamePairsTab } from "./NamePairsTab";
import { OpeningPhrasesTab } from "./OpeningPhrasesTab";
import { useT } from "@/lib/i18n/LanguageContext";

type Tab = "names" | "pairs" | "openings";
const TAB_CLASS = (active: boolean) => `rounded-md px-3 py-1.5 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

/**
 * A dedicated home for the Names of Allah -- pulled out of the general
 * /topics/ index (which was getting crowded once this list grew past a
 * handful of entries) into its own three-tab page: the full curated list,
 * how those names pair up when adjacent in the text, and which verses
 * literally open by invoking Allah.
 */
export function NamesPageContent() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("names");

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.namesPage.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t.namesPage.subtitle}</p>
      </div>

      <div className="flex w-fit flex-wrap rounded-lg border border-border p-0.5 text-sm">
        <button type="button" onClick={() => setTab("names")} className={TAB_CLASS(tab === "names")}>
          {t.namesPage.tabNames}
        </button>
        <button type="button" onClick={() => setTab("pairs")} className={TAB_CLASS(tab === "pairs")}>
          {t.namesPage.tabPairs}
        </button>
        <button type="button" onClick={() => setTab("openings")} className={TAB_CLASS(tab === "openings")}>
          {t.namesPage.tabOpenings}
        </button>
      </div>

      {tab === "names" && <TopicSection heading={t.namesPage.tabNames} topics={DIVINE_NAME_TOPICS} />}
      {tab === "pairs" && <NamePairsTab />}
      {tab === "openings" && <OpeningPhrasesTab />}
    </div>
  );
}
