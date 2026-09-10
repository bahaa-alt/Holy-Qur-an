"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { TopicCompareView } from "./TopicCompareView";

export function TopicComparePageContent() {
  const t = useT();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.topicCompare.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.topicCompare.subtitle}</p>
      </div>
      <TopicCompareView />
    </div>
  );
}
