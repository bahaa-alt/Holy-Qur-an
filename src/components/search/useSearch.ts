"use client";

import { useEffect, useMemo, useState } from "react";
import { isArabic } from "@/lib/arabic/normalize";
import { getEnIndex, getForms, getIndex, getMeta, getVerses } from "@/lib/data/loader";
import { globalIdToRef } from "@/lib/data/verseId";
import { searchEnglish, searchGlossText } from "@/lib/search/english";
import { buildArabicSuggestions, buildBuckwalterSuggestions, verseHref, type Suggestion } from "@/lib/search/suggest";
import type { EnIndexFile, FormsEntry, IndexFile, MetaFile } from "@/lib/data/types";

interface LoadedData {
  index: IndexFile;
  forms: FormsEntry[];
  enIndex: EnIndexFile;
  meta: MetaFile;
}

let loadedDataPromise: Promise<LoadedData> | null = null;
function loadAll(): Promise<LoadedData> {
  if (!loadedDataPromise) {
    loadedDataPromise = Promise.all([getIndex(), getForms(), getEnIndex(), getMeta()]).then(
      ([index, forms, enIndex, meta]) => ({ index, forms, enIndex, meta }),
    );
  }
  return loadedDataPromise;
}

export interface UseSearchResult {
  suggestions: Suggestion[];
}

const DEBOUNCE_MS = 80;
const EMPTY_SUGGESTIONS: Suggestion[] = [];

export function useSearch(query: string): UseSearchResult {
  const [data, setData] = useState<LoadedData | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const trimmed = query.trim();

  useEffect(() => {
    let cancelled = false;
    loadAll().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data || trimmed === "") return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await computeSuggestions(trimmed, data);
      if (!cancelled) setSuggestions(results);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, data]);

  // Derived rather than reset via effect: an empty (or not-yet-loaded) query
  // always has no suggestions, regardless of what a stale async result set.
  const effectiveSuggestions = !data || trimmed === "" ? EMPTY_SUGGESTIONS : suggestions;

  return useMemo(() => ({ suggestions: effectiveSuggestions }), [effectiveSuggestions]);
}

async function computeSuggestions(query: string, data: LoadedData): Promise<Suggestion[]> {
  const arabic = isArabic(query);

  if (arabic) {
    return buildArabicSuggestions(query, data.index, data.forms);
  }

  const rootMatches = buildBuckwalterSuggestions(query, data.index);
  const englishMatches = searchEnglish(query, data.enIndex, 6);
  const glossMatches = searchGlossText(query, data.index.roots, 2).map((r) => ({
    kind: "root" as const,
    key: `gloss-${r.ar}`,
    primary: r.ar,
    secondary: r.glossShort,
    href: `/root/${encodeURIComponent(r.ar)}/`,
  }));

  const verseSuggestions: Suggestion[] = [];
  if (englishMatches.length > 0) {
    const refs = englishMatches.map((m) => globalIdToRef(data.meta, m.globalId)).filter((r) => r !== null);
    const verses = await getVerses(refs);
    for (const ref of refs) {
      const verse = verses.get(`${ref.s}:${ref.a}`);
      if (!verse) continue;
      verseSuggestions.push({
        kind: "verse",
        key: `verse-${ref.s}-${ref.a}`,
        primary: `${ref.s}:${ref.a}`,
        secondary: verse.t,
        href: verseHref(ref.s, ref.a),
      });
    }
  }

  return [...rootMatches, ...glossMatches, ...verseSuggestions];
}
