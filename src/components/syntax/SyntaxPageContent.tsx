"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSurah, getSyntaxIndex } from "@/lib/data/loader";
import { KwicRow } from "@/components/ayah/KwicRow";
import { Pagination } from "@/components/ayah/Pagination";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import type { SurahFile, SurahMeta, SyntaxIndexFile } from "@/lib/data/types";

const PAGE_SIZE = 25;

export interface SyntaxTagRow {
  tag: string;
  idx: number;
  count: number;
  en: string;
  ar: string;
}

/**
 * Browse the syntactic / rhetorical layer (see SyntaxIndexFile): pick a
 * function, see every segment in the Qur'an that carries it, in corpus
 * order, as KWIC lines linking to the verse.
 *
 * The tag list and its counts are computed at build time and arrive as
 * props, so the picker paints immediately; the ~215 KB index itself is
 * fetched only once a tag is actually chosen. Verse text for the visible
 * page is fetched per surah through the shared loader cache, the same way
 * AyahExplorer does it, so paging never refetches a surah already held.
 */
export function SyntaxPageContent({
  tags,
  surahs,
  total,
}: {
  tags: SyntaxTagRow[];
  surahs: SurahMeta[];
  total: number;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  const [index, setIndex] = useState<SyntaxIndexFile | null>(null);
  const [page, setPage] = useState(0);
  const [verses, setVerses] = useState<Map<number, SurahFile>>(new Map());

  const surahByNum = useMemo(() => new Map(surahs.map((s) => [s.n, s])), [surahs]);

  useEffect(() => {
    if (selected === null || index !== null) return;
    let cancelled = false;
    getSyntaxIndex().then((i) => {
      if (!cancelled) setIndex(i);
    });
    return () => {
      cancelled = true;
    };
  }, [selected, index]);

  // Row positions carrying the selected tag. Held as positions into the
  // columnar index rather than materialized objects -- 17,014 rows means
  // even the largest tag (REM, 2,925) stays cheap to slice per page.
  const hits = useMemo(() => {
    if (index === null || selected === null) return [];
    const out: number[] = [];
    for (let i = 0; i < index.t.length; i += 1) {
      if (index.t[i] === selected) out.push(i);
    }
    return out;
  }, [index, selected]);

  const pageCount = Math.ceil(hits.length / PAGE_SIZE);
  const pageHits = useMemo(
    () => hits.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [hits, page],
  );

  // Fetch only the surahs the visible page needs. getSurah() is cached in
  // the loader, so revisiting a page is free.
  useEffect(() => {
    if (index === null || pageHits.length === 0) return;
    const needed = [...new Set(pageHits.map((i) => index.s[i]))].filter((n) => !verses.has(n));
    if (needed.length === 0) return;

    let cancelled = false;
    Promise.all(needed.map((n) => getSurah(n))).then((files) => {
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
  }, [index, pageHits, verses]);

  const selectedRow = selected === null ? null : (tags.find((x) => x.idx === selected) ?? null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">{t.syntaxPage.heading}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t.syntaxPage.intro}</p>
      <p className="mt-1 text-xs text-muted">{t.syntaxPage.totalSegments(total)}</p>

      <h2 className="mt-6 text-sm font-medium text-ink">{t.syntaxPage.pickTag}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((row) => {
          const active = row.idx === selected;
          return (
            <button
              key={row.tag}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setSelected(active ? null : row.idx);
                setPage(0);
              }}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-ink hover:border-accent hover:text-accent"
              }`}
            >
              {/* Every tag carries both labels; the chip shows the one the
                  reader is reading in. See tagLabels.ts. */}
              {lang === "ar" ? row.ar : row.en}
              <span className="ms-1.5 text-xs text-muted">{row.count.toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {selectedRow === null ? (
          <p className="text-sm text-muted">{t.syntaxPage.noneSelected}</p>
        ) : index === null ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={14} className="animate-spin" />
            {t.syntaxPage.loading}
          </p>
        ) : (
          <>
            <h2 className="text-sm font-medium text-ink">
              {t.syntaxPage.occurrencesIn(lang === "ar" ? selectedRow.ar : selectedRow.en)}{" "}
              {/* The other language's term alongside it: a grammatical term
                  is worth having in both, and which one needs the Arabic
                  typography flips with the interface language. */}
              {lang === "ar" ? (
                <span className="text-muted">{selectedRow.en}</span>
              ) : (
                <span dir="rtl" lang="ar" className="arabic-ui text-muted">
                  {selectedRow.ar}
                </span>
              )}
            </h2>
            <div className="mt-3">
              {pageHits.map((i) => {
                const surahMeta = surahByNum.get(index.s[i]);
                const verse = verses.get(index.s[i])?.verses.find((v) => v.a === index.a[i]);
                if (!surahMeta || !verse) return null;
                return (
                  <KwicRow
                    key={`${index.s[i]}:${index.a[i]}:${index.w[i]}:${index.g[i]}`}
                    surahMeta={surahMeta}
                    ayah={index.a[i]}
                    tokens={verse.w}
                    wordIndex={index.w[i]}
                  />
                );
              })}
            </div>
            <div className="mt-4">
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <div className="mt-10 space-y-3 border-t border-border pt-6 text-xs leading-relaxed text-muted">
        <p>{t.syntaxPage.methodologyNote}</p>
        <p>{t.syntaxPage.passiveNote}</p>
      </div>
    </div>
  );
}
