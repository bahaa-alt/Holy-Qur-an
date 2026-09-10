"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { CompareView } from "./CompareView";
import type { CompareRootRow } from "./RootPicker";

export function ComparePageContent({ roots }: { roots: CompareRootRow[] }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.compare.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.compare.subtitle}</p>
      </div>
      <CompareView roots={roots} />
    </div>
  );
}
