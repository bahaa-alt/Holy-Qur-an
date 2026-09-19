"use client";

import Link from "next/link";
import { AbjadTab } from "@/components/insights/AbjadTab";
import { useT } from "@/lib/i18n/LanguageContext";
import type { MetaFile } from "@/lib/data/types";

export function CuriositiesPageContent({ meta }: { meta: MetaFile }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">{t.curiositiesPage.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.curiositiesPage.intro}</p>
      <p className="mt-3 max-w-2xl rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed text-muted">
        {t.curiositiesPage.caveat}
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink">{t.insightsPage.tabAbjad}</h2>
      <div className="mt-3">
        <AbjadTab meta={meta} />
      </div>

      <p className="mt-8 text-sm text-muted">
        <Link href="/insights/" className="text-accent hover:text-accent-strong">
          {t.curiositiesPage.backToInsights}
        </Link>
      </p>
    </div>
  );
}
