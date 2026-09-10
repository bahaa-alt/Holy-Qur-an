"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { GamesHub } from "./GamesHub";

export function GamesPageContent() {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.gamesPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.gamesPage.subtitle}</p>
      </div>
      <GamesHub />
    </div>
  );
}
