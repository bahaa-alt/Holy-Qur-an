import type { Cat, MetaFile, OccurrenceIndexFile, SyntaxIndexFile } from "@/lib/data/types";

/**
 * The syntactic layer (see SyntaxIndexFile) reshaped for filtering, at the
 * two different scopes it can meaningfully be asked about.
 *
 * These are genuinely two questions, not one, which is why the UI exposes
 * two facets rather than making the user guess which is meant:
 *
 *  - `byWord` answers "is THIS word a passive verb / a restriction
 *    particle". Only ~1,601 segments qualify, because the other ~15,413
 *    tagged segments are rootless particles that have no occurrence row to
 *    filter in the first place. In practice this facet is mostly PASS.
 *  - `byVerse` answers "does the verse this occurrence sits in contain a
 *    conditional / a ḥaṣr / a vocative". Every tag is useful here, and it
 *    is the scope that composes into real queries -- "root كتب inside a
 *    conditional clause" is a verse-scope question about a word-scope
 *    subject.
 *
 * Keys are `"s:a:w"` and `"s:a"`. A word or verse with no tags has no
 * entry at all rather than an empty set, so a miss is one Map lookup.
 */
export interface SyntaxLookups {
  byWord: Map<string, Set<string>>;
  byVerse: Map<string, Set<string>>;
}

/** Builds both scopes in one pass over the columnar syntax index. */
export function buildSyntaxLookups(syntax: SyntaxIndexFile): SyntaxLookups {
  const byWord = new Map<string, Set<string>>();
  const byVerse = new Map<string, Set<string>>();

  for (let i = 0; i < syntax.t.length; i += 1) {
    const tag = syntax.tags[syntax.t[i]];
    if (tag === undefined) continue;

    // A single word can contribute more than one tag: its segments are
    // tagged independently, so e.g. فَلَا is one word carrying REM on its
    // first segment and NEG on its second.
    const wordKey = `${syntax.s[i]}:${syntax.a[i]}:${syntax.w[i]}`;
    const wordTags = byWord.get(wordKey);
    if (wordTags) wordTags.add(tag);
    else byWord.set(wordKey, new Set([tag]));

    const verseKey = `${syntax.s[i]}:${syntax.a[i]}`;
    const verseTags = byVerse.get(verseKey);
    if (verseTags) verseTags.add(tag);
    else byVerse.set(verseKey, new Set([tag]));
  }

  return { byWord, byVerse };
}

function hasAny(have: ReadonlySet<string> | undefined, want: ReadonlySet<string>): boolean {
  if (have === undefined) return false;
  for (const tag of want) if (have.has(tag)) return true;
  return false;
}

/**
 * Facets for the cross-corpus advanced search (/search/advanced). Each
 * facet is a set of accepted values; an empty or missing set means "don't
 * filter on this facet" -- so the default (no filters) returns everything.
 * `revelationType` is single-valued (Meccan/Medinan is a per-surah
 * classification, not a per-occurrence one worth multi-selecting).
 */
export interface AdvancedSearchFilters {
  cats?: ReadonlySet<Cat>;
  /** 1-11 (Form I-XI); 0 would mean "no VF tag", but that's not a useful facet to filter on */
  verbForms?: ReadonlySet<number>;
  rootIdxs?: ReadonlySet<number>;
  surahs?: ReadonlySet<number>;
  revelationType?: "meccan" | "medinan";
  /**
   * Syntactic tags carried by the occurrence's OWN word. Requires
   * `syntax`; see SyntaxLookups for why this is separate from
   * `verseSyntaxTags`.
   */
  wordSyntaxTags?: ReadonlySet<string>;
  /** Syntactic tags present anywhere in the occurrence's verse. Requires `syntax`. */
  verseSyntaxTags?: ReadonlySet<string>;
  /**
   * The lookups the two tag facets read. Optional because syntax.json is
   * fetched lazily -- when it is absent the tag facets are skipped rather
   * than matching nothing, so a selected tag never silently reads as
   * "0 results" while the data is still in flight.
   */
  syntax?: SyntaxLookups;
}

export interface AdvancedSearchRow {
  s: number;
  a: number;
  w: number;
  rootIdx: number;
  lemmaIdx: number;
  cat: Cat;
  /** 0 = no VF tag (non-verb, or a verb form the corpus left unmarked) */
  verbForm: number;
}

/**
 * Filters the global occurrence index (rooted occurrences only, matching
 * this app's documented "occurrence" methodology) by any combination of
 * category, verb Form, root, surah, and Meccan/Medinan -- the cross-corpus
 * combination no single root's own AyahExplorer can answer, since each
 * root file only carries its own occurrences.
 */
export function filterOccurrences(
  file: OccurrenceIndexFile,
  meta: MetaFile,
  filters: AdvancedSearchFilters,
): AdvancedSearchRow[] {
  const surahType = new Map(meta.surahs.map((sm) => [sm.n, sm.type]));
  const result: AdvancedSearchRow[] = [];

  for (const [s, a, w, rootIdx, lemmaIdx, catIdx, verbForm] of file.rows) {
    const cat = file.cats[catIdx];
    if (filters.cats && filters.cats.size > 0 && !filters.cats.has(cat)) continue;
    if (filters.verbForms && filters.verbForms.size > 0 && !filters.verbForms.has(verbForm)) continue;
    if (filters.rootIdxs && filters.rootIdxs.size > 0 && !filters.rootIdxs.has(rootIdx)) continue;
    if (filters.surahs && filters.surahs.size > 0 && !filters.surahs.has(s)) continue;
    if (filters.revelationType && surahType.get(s) !== filters.revelationType) continue;
    if (filters.syntax) {
      const { wordSyntaxTags, verseSyntaxTags } = filters;
      if (wordSyntaxTags && wordSyntaxTags.size > 0) {
        if (!hasAny(filters.syntax.byWord.get(`${s}:${a}:${w}`), wordSyntaxTags)) continue;
      }
      if (verseSyntaxTags && verseSyntaxTags.size > 0) {
        if (!hasAny(filters.syntax.byVerse.get(`${s}:${a}`), verseSyntaxTags)) continue;
      }
    }

    result.push({ s, a, w, rootIdx, lemmaIdx, cat, verbForm });
  }

  return result;
}
