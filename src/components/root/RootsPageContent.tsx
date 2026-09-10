"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { RootsBrowser } from "./RootsBrowser";

interface RootRow {
  ar: string;
  key: string;
  count: number;
}

export function RootsPageContent({ roots }: { roots: RootRow[] }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">{t.roots.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.roots.subtitle(roots.length)}</p>
      <div className="mt-6">
        <RootsBrowser roots={roots} />
      </div>
    </div>
  );
}
