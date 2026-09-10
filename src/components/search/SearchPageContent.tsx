"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { PhraseTextSearch } from "./PhraseTextSearch";

export function SearchPageContent() {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.searchPage.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.searchPage.subtitle}{" "}
          <Link href="/phrases/" className="text-accent hover:text-accent-strong">
            {t.searchPage.phrasesLinkLabel}
          </Link>{" "}
          {t.searchPage.subtitleAfterLink}
        </p>
      </div>
      <PhraseTextSearch />
    </div>
  );
}
