"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { GrammarBrowser, type FacetCounts } from "@/components/syntax/GrammarBrowser";
import type { SurahMeta } from "@/lib/data/types";

/**
 * The grammar page: browse the corpus by any feature the corpus marks.
 *
 * This is the shell -- heading, framing, methodology notes. The browsing
 * itself is GrammarBrowser, which runs every chip as a QCQL query so this
 * page and /query/ can never disagree about what a filter means.
 */
export function SyntaxPageContent({
  surahs,
  counts,
  totalTaggedSegments,
}: {
  surahs: SurahMeta[];
  counts: FacetCounts;
  totalTaggedSegments: number;
}) {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">{t.syntaxPage.heading}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t.syntaxPage.intro}</p>
      <p className="mt-1 text-xs text-muted">{t.syntaxPage.totalSegments(totalTaggedSegments)}</p>

      <GrammarBrowser surahs={surahs} counts={counts} />

      <div className="mt-10 space-y-3 border-t border-border pt-6 text-xs leading-relaxed text-muted">
        <p>{t.syntaxPage.positionNote}</p>
        <p>{t.syntaxPage.methodologyNote}</p>
        <p>{t.syntaxPage.passiveNote}</p>
      </div>
    </div>
  );
}
