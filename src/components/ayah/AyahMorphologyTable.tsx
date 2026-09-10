"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { lookupVerseWordInfos, type WordLookupResult } from "@/lib/word/lookupWordInfo";
import { describeTags } from "@/lib/morphology/tagLabels";
import { rootHref, wordHref } from "@/lib/search/suggest";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";

/**
 * Word-by-word grammatical breakdown of an entire verse, shown all at once
 * instead of one word at a time -- resolves every word via
 * lookupVerseWordInfos (which dedupes root-file fetches when the same root
 * occurs more than once in the verse) and renders one row per word, in
 * Qur'an order. A rootless word (particle/pronoun/clitic) gets a single
 * spanning "no root" cell, same distinction WordInfoPanel already makes.
 */
export function AyahMorphologyTable({ s, a, tokens }: { s: number; a: number; tokens: string[] }) {
  const t = useT();
  const { lang } = useLanguage();
  const [rows, setRows] = useState<WordLookupResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    lookupVerseWordInfos(s, a, tokens.length).then((results) => {
      if (!cancelled) setRows(results);
    });
    return () => {
      cancelled = true;
    };
  }, [s, a, tokens.length]);

  if (rows === null) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" /> {t.ayahMorphologyTable.loading}
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-bg text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 text-start">{t.ayahMorphologyTable.wordColumn}</th>
            <th className="px-3 py-2 text-start">{t.ayahMorphologyTable.rootColumn}</th>
            <th className="px-3 py-2 text-start">{t.ayahMorphologyTable.lemmaColumn}</th>
            <th className="px-3 py-2 text-start">{t.ayahMorphologyTable.categoryColumn}</th>
            <th className="px-3 py-2 text-start">{t.ayahMorphologyTable.grammarColumn}</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, i) => {
            const result = rows[i];
            return (
              <tr key={i} className="border-b border-border last:border-b-0">
                <td className="arabic-ui px-3 py-2 text-base text-ink">{token}</td>
                {result?.status === "found" ? (
                  <>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={rootHref(result.info.rootAr)}
                        className="arabic-ui text-accent hover:text-accent-strong"
                      >
                        {result.info.rootAr}
                      </Link>
                      {result.info.rootBw && (
                        <span className="ms-1 font-mono text-xs text-muted">/{result.info.rootBw}/</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={wordHref(result.info.globalLemmaIdx)}
                        className="arabic-ui text-accent hover:text-accent-strong"
                      >
                        {result.info.lemma}
                      </Link>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-ink">{t.categories[result.info.cat]}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {describeTags(result.info.tagsJoined).map((tag, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-ink"
                          >
                            {lang === "ar" ? tag.ar : tag.en}
                          </span>
                        ))}
                      </div>
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className="px-3 py-2 text-xs text-muted">
                    {t.ayahMorphologyTable.notRooted}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
