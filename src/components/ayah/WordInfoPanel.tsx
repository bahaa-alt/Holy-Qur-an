"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { lookupWordInfo, type WordLookupResult } from "@/lib/word/lookupWordInfo";
import { describeTags } from "@/lib/morphology/tagLabels";
import { rootHref, wordHref } from "@/lib/search/suggest";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";

type LookupState = { status: "loading" } | WordLookupResult;

/**
 * On-demand "what is this word" panel, shown below a verse when a reader
 * taps one of its words. Resolves the clicked word's root/lemma/category
 * and occurrence counts from data the app already ships (verse-roots.json
 * for the root, that root's own file for the lemma/form detail) -- see
 * src/lib/word/wordInfo.ts. A word with no root (particle, pronoun,
 * clitic) resolves to "not-rooted" rather than an error, matching how the
 * rest of the app already explains that distinction (About page).
 *
 * Callers must render this keyed by the word's identity (e.g.
 * `key={`${s}:${a}:${w}`}`) rather than a fixed key -- React then remounts
 * a fresh instance on every newly clicked word, which is what resets the
 * lookup state to "loading" for the new word. That's simpler and avoids an
 * effect-driven reset for what is, from this component's own point of
 * view, a completely new subject every time its props change.
 */
export function WordInfoPanel({
  s,
  a,
  w,
  token,
  onClose,
}: {
  s: number;
  a: number;
  w: number;
  token: string;
  onClose: () => void;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const [state, setState] = useState<LookupState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    lookupWordInfo(s, a, w).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [s, a, w]);

  return (
    <div className="mt-3 rounded-xl border border-border bg-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="arabic-ui text-lg text-ink">{token}</span>
        <button type="button" onClick={onClose} aria-label={t.wordInfoPanel.close} className="text-muted hover:text-ink">
          <X size={16} />
        </button>
      </div>

      {state.status === "loading" && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.wordInfoPanel.loading}
        </p>
      )}

      {state.status === "not-rooted" && <p className="mt-2 text-sm text-muted">{t.wordInfoPanel.notRooted}</p>}

      {state.status === "found" && (
        <div className="mt-2 space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span>
              <span className="text-xs uppercase tracking-wide text-muted">{t.wordInfoPanel.root}: </span>
              <Link
                href={rootHref(state.info.rootAr)}
                className="arabic-ui text-base text-accent hover:text-accent-strong"
              >
                {state.info.rootAr}
              </Link>
              {state.info.rootBw && <span className="ms-1 font-mono text-xs text-muted">/{state.info.rootBw}/</span>}
            </span>
            <span>
              <span className="text-xs uppercase tracking-wide text-muted">{t.wordInfoPanel.lemma}: </span>
              <Link
                href={wordHref(state.info.globalLemmaIdx)}
                className="arabic-ui text-base text-accent hover:text-accent-strong"
              >
                {state.info.lemma}
              </Link>
            </span>
            <span>
              <span className="text-xs uppercase tracking-wide text-muted">{t.wordInfoPanel.category}: </span>
              <span className="text-ink">{t.categories[state.info.cat]}</span>
            </span>
          </div>

          {state.info.rootGlossShort && <p className="text-muted">{state.info.rootGlossShort}</p>}

          {describeTags(state.info.tagsJoined).length > 0 && (
            <div>
              <span className="text-xs uppercase tracking-wide text-muted">{t.wordInfoPanel.grammar}: </span>
              <span className="inline-flex flex-wrap gap-1.5 align-middle">
                {describeTags(state.info.tagsJoined).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-ink"
                  >
                    {lang === "ar" ? tag.ar : tag.en}
                  </span>
                ))}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>{t.wordInfoPanel.occurrencesOfRoot(state.info.rootTotal)}</span>
            <span>{t.wordInfoPanel.occurrencesOfLemma(state.info.lemmaCount)}</span>
            <span>{t.wordInfoPanel.occurrencesOfForm(state.info.formCount)}</span>
          </div>

          <div className="flex flex-wrap gap-3 pt-1 text-xs">
            <Link href={rootHref(state.info.rootAr)} className="text-accent hover:text-accent-strong">
              {t.wordInfoPanel.viewRootPage} →
            </Link>
            <Link href={wordHref(state.info.globalLemmaIdx)} className="text-accent hover:text-accent-strong">
              {t.wordInfoPanel.viewWordPage} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
