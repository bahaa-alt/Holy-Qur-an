"use client";

import { useImperativeHandle, useState } from "react";
import { getVerses } from "@/lib/data/loader";
import { useT } from "@/lib/i18n/LanguageContext";
import type { TopicDefinition } from "@/lib/topics/topicDefinitions";
import type { TopicVerseMatch } from "@/lib/topics/buildTopicOccurrences";
import type { SurahVerse } from "@/lib/data/types";

export interface PrintableTopicVersesHandle {
  /** Resolves every matched verse's text/translation, if not already done. Awaited by PrintButton before window.print(). */
  resolve: () => Promise<void>;
}

interface ResolvedRow {
  s: number;
  a: number;
  verse: SurahVerse;
}

/**
 * The print-only, full (not paginated-to-25) rendering of a topic's matched
 * verses. TopicVerseList only ever resolves the current on-screen page via
 * getVerses; this component holds the full `matches` list TopicPageContent
 * already has in full (computed server-side, not paginated) and, only once
 * the print button is actually clicked, resolves and renders all of them --
 * lazy so a normal page view never fetches every verse up front.
 */
export function PrintableTopicVerses({
  ref,
  matches,
  topic,
}: {
  ref?: React.Ref<PrintableTopicVersesHandle>;
  matches: readonly TopicVerseMatch[];
  topic: TopicDefinition;
}) {
  const t = useT();
  const [rows, setRows] = useState<ResolvedRow[] | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      resolve: async () => {
        if (rows) return;
        const verseMap = await getVerses(matches.map((m) => ({ s: m.s, a: m.a })));
        const resolved = matches
          .map((m): ResolvedRow | null => {
            const verse = verseMap.get(`${m.s}:${m.a}`);
            return verse ? { s: m.s, a: m.a, verse } : null;
          })
          .filter((r): r is ResolvedRow => r !== null);
        setRows(resolved);
      },
    }),
    [matches, rows],
  );

  if (!rows) return null;

  return (
    <div className="hidden print:block">
      <h1 className="text-xl font-semibold text-ink">
        {topic.labelEn} <span className="arabic-ui">({topic.labelAr})</span>
      </h1>
      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={`${row.s}:${row.a}`} className="print-avoid-break">
            <p className="text-xs text-muted">
              {row.s}:{row.a}
            </p>
            <p className="uthmani text-ink">{row.verse.w.join(" ")}</p>
            <p className="text-sm text-ink">{row.verse.t}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">
        {t.printButton.printedFrom(typeof window !== "undefined" ? window.location.href : "")}{" "}
        {t.printButton.printedOn(new Date().toLocaleDateString())}
      </p>
    </div>
  );
}
