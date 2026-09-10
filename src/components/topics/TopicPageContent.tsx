"use client";

import { useRef } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import { TopicVerseList } from "./TopicVerseList";
import { PrintableTopicVerses, type PrintableTopicVersesHandle } from "./PrintableTopicVerses";
import { PrintButton } from "@/components/export/PrintButton";
import type { TopicDefinition } from "@/lib/topics/topicDefinitions";
import type { TopicVerseMatch } from "@/lib/topics/buildTopicOccurrences";

export function TopicPageContent({ topic, matches }: { topic: TopicDefinition; matches: TopicVerseMatch[] }) {
  const t = useT();
  const printRef = useRef<PrintableTopicVersesHandle>(null);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="print:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {topic.category === "prophet" ? t.topicPage.prophetLabel : t.topicPage.topicLabel}
            </p>
            <h1 className="arabic-ui mt-1 text-3xl font-semibold text-ink">{topic.labelAr}</h1>
            <p className="text-sm text-muted">{topic.labelEn}</p>
          </div>
          <PrintButton onBeforePrint={() => printRef.current?.resolve()} />
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted">{t.topicPage.description(matches.length)}</p>
        {topic.note && (
          <p className="mt-2 max-w-2xl text-xs text-muted/80">
            {t.topicPage.noteLabel}
            {topic.note}
          </p>
        )}
      </div>
      <div className="print:hidden">
        <TopicVerseList matches={matches} />
      </div>
      <PrintableTopicVerses ref={printRef} matches={matches} topic={topic} />
    </div>
  );
}
