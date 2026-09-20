"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  getIndex,
  getMorphologyIndex,
  getOccurrenceIndex,
  getSurah,
  getSyntaxIndex,
} from "@/lib/data/loader";
import { KwicRow } from "@/components/ayah/KwicRow";
import { ExportButton } from "@/components/export/ExportButton";
import { SaveButton } from "@/components/notes/SaveButton";
import { buildMatchesTable } from "@/lib/export/matches";
import { Pagination } from "@/components/ayah/Pagination";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { GRAMMAR_GROUPS, type Facet } from "@/lib/grammar/facets";
import { describeTag } from "@/lib/morphology/tagLabels";
import { executeQcql, type QcqlCorpus } from "@/lib/qcql/execute";
import { parseQcql } from "@/lib/qcql/parse";
import { needsMorphology, type QcqlMatch } from "@/lib/qcql/types";
import type { SurahFile, SurahMeta } from "@/lib/data/types";

const PAGE_SIZE = 25;
const FACET_PARAM = "f";

/** Counts computed at build time, so chips have real numbers on first paint. */
export type FacetCounts = Record<string, number>;

/**
 * Browse the corpus by grammatical feature.
 *
 * Every chip is a QCQL query (see lib/grammar/facets.ts) run through the
 * same parser and executor `/query/` uses. There is no second filtering
 * engine here, which is the point: the chips are a tutorial for the
 * language rather than a rival to it, and the query is shown so a reader
 * can carry it over to `/query/` and take it further.
 *
 * The morphology index is 176 KB gzipped and only some facets need it, so
 * it is fetched on the first click of one that does, not on arrival.
 */
export function GrammarBrowser({ surahs, counts }: { surahs: SurahMeta[]; counts: FacetCounts }) {
  const t = useT();
  const { lang } = useLanguage();
  const [active, setActive] = useState<Facet | null>(null);
  const [corpus, setCorpus] = useState<QcqlCorpus | null>(null);
  const [matches, setMatches] = useState<QcqlMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(0);
  const [verses, setVerses] = useState<Map<number, SurahFile>>(new Map());
  const [hydrated, setHydrated] = useState(false);

  const surahByNum = useMemo(() => new Map(surahs.map((s) => [s.n, s])), [surahs]);

  const label = useCallback(
    (f: Facet) => {
      if (f.tag) {
        const l = describeTag(f.tag);
        return lang === "ar" ? l.ar : l.en;
      }
      return (lang === "ar" ? f.ar : f.en) ?? f.id;
    },
    [lang],
  );

  const run = useCallback(
    async (facet: Facet) => {
      setActive(facet);
      setPage(0);
      setFailed(false);
      setLoading(true);
      try {
        const query = parseQcql(facet.q);
        // Fetch only what this facet reads: the two core indices always,
        // morphology only when the query names one of its features.
        const wantMorph = needsMorphology(query);
        let next = corpus;
        if (!next || (wantMorph && !next.morphology)) {
          const [occurrences, syntax, index, morphology] = await Promise.all([
            next?.occurrences ?? getOccurrenceIndex(),
            next?.syntax ?? getSyntaxIndex(),
            next?.index ?? getIndex(),
            wantMorph ? getMorphologyIndex() : Promise.resolve(next?.morphology),
          ]);
          next = { occurrences, syntax, index, surahs, morphology };
          setCorpus(next);
        }
        setMatches(executeQcql(query, next).matches);
      } catch {
        setMatches(null);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [corpus, surahs],
  );

  // Restore a facet named in the URL, so a shared link opens on its results.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(FACET_PARAM);
    const found = id
      ? GRAMMAR_GROUPS.flatMap((g) => g.sections.flatMap((s) => s.facets)).find((f) => f.id === id)
      : undefined;
    if (found) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the URL, not a subscription.
      setActive(found);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || active === null || matches !== null || loading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time run of a facet restored from the URL.
    void run(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (active === null) return;
    const url = new URL(window.location.href);
    url.searchParams.set(FACET_PARAM, active.id);
    window.history.replaceState(null, "", url);
  }, [active]);

  // Stable identity when there is nothing to show, so the paging memo and
  // the verse-fetch effect below do not rerun on every render.
  const shown = useMemo(() => matches ?? [], [matches]);
  const pageCount = Math.ceil(shown.length / PAGE_SIZE);
  const pageMatches = useMemo(
    () => shown.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [shown, page],
  );

  useEffect(() => {
    if (pageMatches.length === 0) return;
    const needed = [...new Set(pageMatches.map((m) => m.s))].filter((n) => !verses.has(n));
    if (needed.length === 0) return;
    let cancelled = false;
    void Promise.all(needed.map((n) => getSurah(n))).then((files) => {
      if (cancelled) return;
      setVerses((prev) => {
        const next = new Map(prev);
        for (const f of files) next.set(f.n, f);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pageMatches, verses]);

  return (
    <>
      {GRAMMAR_GROUPS.map((group) => (
        <section key={group.id} className="mt-8">
          <h2 className="text-lg font-semibold text-ink">{t.grammarPage.groups[group.labelKey]}</h2>
          {group.sections.map((section) => (
            <div key={section.id} className="mt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                {t.grammarPage.sections[section.labelKey]}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {section.facets.map((facet) => {
                  const on = active?.id === facet.id;
                  return (
                    <button
                      key={facet.id}
                      type="button"
                      aria-pressed={on}
                      // The corpus's own code, for a reader who works from
                      // the tagset. The chip itself says it in words.
                      title={facet.code}
                      onClick={() => void run(facet)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        on
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-surface text-ink hover:border-accent hover:text-accent"
                      }`}
                    >
                      {label(facet)}
                      <span className="ms-1.5 text-xs text-muted">
                        {(counts[facet.id] ?? 0).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}

      <div className="mt-10 border-t border-border pt-6">
        {active === null ? (
          <p className="text-sm text-muted">{t.grammarPage.noneSelected}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium text-ink">
                {t.grammarPage.occurrencesIn(label(active))}
                {/* The corpus's code beside the word for it, so a reader
                    who arrived by clicking learns the tagset they will
                    need to write their own queries. */}
                {active.code && (
                  <span className="ms-2 font-mono text-xs font-normal text-muted" dir="ltr">
                    {active.code}
                  </span>
                )}
              </h2>
              {/* The query that produced this, and a way to keep going with
                  it. The chips are the tutorial; /query/ is the language. */}
              <Link
                href={`/query/?q=${encodeURIComponent(active.q)}`}
                aria-label={t.grammarPage.openInQuery}
                className="font-mono text-xs text-accent hover:text-accent-strong"
                dir="ltr"
              >
                {active.q} →
              </Link>
            </div>

            {/* The same three affordances every result in this app now
                carries: keep it, take it away, cite it. */}
            {!loading && !failed && shown.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SaveButton
                  id={`view:grammar:${active.id}`}
                  kind="view"
                  label={label(active)}
                  detail={t.grammarPage.matchCount(shown.length)}
                  href={`/syntax/?${FACET_PARAM}=${encodeURIComponent(active.id)}`}
                  compact
                />
                <ExportButton
                  path={`/syntax/?${FACET_PARAM}=${encodeURIComponent(active.id)}`}
                  subject={{ kind: "grammar", label: `${label(active)} (${active.q})` }}
                  resolve={() =>
                    buildMatchesTable(shown, surahs, {
                      slug: `grammar-${active.id}`,
                      title: `${label(active)} — ${active.q}`,
                      provenance: [
                        { label: "facet", value: label(active) },
                        { label: "query", value: active.q },
                        { label: "matches", value: String(shown.length) },
                      ],
                    })
                  }
                />
              </div>
            )}

            {loading ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <Loader2 size={14} className="animate-spin" />
                {t.grammarPage.loading}
              </p>
            ) : failed ? (
              <p className="mt-3 text-sm text-muted">{t.grammarPage.failed}</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted">{t.grammarPage.matchCount(shown.length)}</p>
                <div className="mt-3">
                  {pageMatches.map((m) => {
                    const surahMeta = surahByNum.get(m.s);
                    const verse = verses.get(m.s)?.verses.find((v) => v.a === m.a);
                    if (!surahMeta || !verse) return null;
                    return (
                      <KwicRow
                        key={`${m.s}:${m.a}:${m.w}`}
                        surahMeta={surahMeta}
                        ayah={m.a}
                        tokens={verse.w}
                        wordIndex={m.w}
                      />
                    );
                  })}
                </div>
                {pageCount > 1 && (
                  <div className="mt-4">
                    <Pagination page={page} pageCount={pageCount} onChange={setPage} />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
