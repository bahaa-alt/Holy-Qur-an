"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import {
  ANGEL_TOPICS,
  BOOK_TOPICS,
  COMMODITIES_TOPICS,
  COSMOLOGY_TOPICS,
  GEOGRAPHY_TOPICS,
  GEOLOGY_TOPICS,
  METEOROLOGY_TOPICS,
  NUMBER_TOPICS,
  OBJECT_TOPICS,
  PEOPLE_TOPICS,
  PROPHET_TOPICS,
  SPECIES_TOPICS,
  THEME_TOPICS,
} from "@/lib/topics/topicDefinitions";
import { TopicSection } from "./TopicSection";

export function TopicsPageContent() {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.topicsPage.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t.topicsPage.subtitle}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/names/" className="text-accent hover:underline">
            {t.topicsPage.namesLink}
          </Link>
          <Link href="/topics/compare/" className="text-accent hover:underline">
            {t.topicsPage.compareLink}
          </Link>
        </div>
      </div>

      <TopicSection heading={t.topicsPage.themes} topics={THEME_TOPICS} />
      <TopicSection heading={t.topicsPage.prophets} topics={PROPHET_TOPICS} />
      <TopicSection heading={t.topicsPage.people} topics={PEOPLE_TOPICS} />
      <TopicSection heading={t.topicsPage.species} topics={SPECIES_TOPICS} />
      <TopicSection heading={t.topicsPage.geography} topics={GEOGRAPHY_TOPICS} />
      <TopicSection heading={t.topicsPage.geology} topics={GEOLOGY_TOPICS} />
      <TopicSection heading={t.topicsPage.meteorology} topics={METEOROLOGY_TOPICS} />
      <TopicSection heading={t.topicsPage.cosmology} topics={COSMOLOGY_TOPICS} />
      <TopicSection heading={t.topicsPage.commodities} topics={COMMODITIES_TOPICS} />
      <TopicSection heading={t.topicsPage.objects} topics={OBJECT_TOPICS} />
      <TopicSection heading={t.topicsPage.books} topics={BOOK_TOPICS} />
      <TopicSection heading={t.topicsPage.angels} topics={ANGEL_TOPICS} />
      <TopicSection heading={t.topicsPage.numbers} topics={NUMBER_TOPICS} />
    </div>
  );
}
