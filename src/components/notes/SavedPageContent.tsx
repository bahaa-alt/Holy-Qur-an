"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { SavedList } from "./SavedList";

export function SavedPageContent() {
  const t = useT();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.savedPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.savedPage.subtitle}</p>
      </div>
      <SavedList />
    </div>
  );
}
