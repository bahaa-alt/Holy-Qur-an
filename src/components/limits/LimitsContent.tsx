"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";

/**
 * One page collecting every scope/limitation caveat already stated
 * elsewhere in the app (About, the tafsir/readings/treebank panels, Topics,
 * Insights) -- nothing here is a new claim, just a single place for a
 * reader who wants the honest edges of the data without hunting for each
 * caveat on the page that happens to carry it.
 */
export function LimitsContent() {
  const t = useT();

  const sections: { heading: string; body: string }[] = [
    { heading: t.limitsPage.readingHeading, body: t.limitsPage.readingBody },
    { heading: t.limitsPage.translationsHeading, body: t.limitsPage.translationsBody },
    { heading: t.limitsPage.tafsirHeading, body: t.limitsPage.tafsirBody },
    { heading: t.limitsPage.topicsHeading, body: t.limitsPage.topicsBody },
    { heading: t.limitsPage.laneHeading, body: t.limitsPage.laneBody },
    { heading: t.limitsPage.syntaxHeading, body: t.limitsPage.syntaxBody },
    { heading: t.limitsPage.readingsPanelHeading, body: t.limitsPage.readingsPanelBody },
    { heading: t.limitsPage.chronologyHeading, body: t.limitsPage.chronologyBody },
    { heading: t.limitsPage.treebankHeading, body: t.limitsPage.treebankBody },
    { heading: t.limitsPage.statsHeading, body: t.limitsPage.statsBody },
    { heading: t.limitsPage.occurrenceHeading, body: t.limitsPage.occurrenceBody },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 text-sm leading-relaxed text-ink">
      <div>
        <h1 className="text-2xl font-semibold">{t.limitsPage.heading}</h1>
        <p className="mt-2 text-muted">{t.limitsPage.intro}</p>
      </div>

      {sections.map((s) => (
        <div key={s.heading}>
          <h2 className="text-lg font-semibold">{s.heading}</h2>
          <p className="mt-2 text-muted">{s.body}</p>
        </div>
      ))}

      <p className="text-xs text-muted">
        {t.limitsPage.aboutLinkNote}{" "}
        <Link href="/about/" className="text-accent hover:underline">
          {t.nav.about}
        </Link>
      </p>
    </div>
  );
}
