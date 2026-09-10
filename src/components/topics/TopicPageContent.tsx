"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { TopicVerseList } from "./TopicVerseList";
import type { TopicDefinition } from "@/lib/topics/topicDefinitions";
import type { TopicVerseMatch } from "@/lib/topics/buildTopicOccurrences";

export function TopicPageContent({ topic, matches }: { topic: TopicDefinition; matches: TopicVerseMatch[] }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {topic.category === "prophet" ? t.topicPage.prophetLabel : t.topicPage.topicLabel}
        </p>
        <h1 className="arabic-ui mt-1 text-3xl font-semibold text-ink">{topic.labelAr}</h1>
        <p className="text-sm text-muted">{topic.labelEn}</p>
        <p className="mt-3 max-w-2xl text-sm text-muted">{t.topicPage.description(matches.length)}</p>
        {topic.note && (
          <p className="mt-2 max-w-2xl text-xs text-muted/80">
            {t.topicPage.noteLabel}
            {topic.note}
          </p>
        )}
      </div>
      <TopicVerseList matches={matches} />
    </div>
  );
}
