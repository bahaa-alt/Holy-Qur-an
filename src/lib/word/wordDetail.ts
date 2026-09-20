import {
  getLaneRoot,
  getMeta,
  getMorphologyIndex,
  getMujamRoot,
  getVerseRoots,
} from "@/lib/data/loader";
import { MORPH_CASES, MORPH_DEFINITENESS, MORPH_MOODS } from "@/lib/morphology/morphFeatures";
import { keyness, type Keyness } from "@/lib/stats/keyness";
import { buildVerseRefs, inScope, type VerseRef } from "@/lib/insights/scope";
import type { MorphologyIndexFile, MujamWork } from "@/lib/data/types";

/**
 * The second layer of the word inspector: everything about a tapped word
 * that the app knows but was making the reader leave the verse to find.
 *
 * Loaded separately from lookupWordInfo, and rendered as it arrives,
 * because these are the expensive parts -- the morphology index is 176 KB
 * gzipped and a lexicon is a per-root fetch. The panel opens instantly
 * with root, lemma and category, and fills in.
 */

export interface SegmentFeatures {
  /** segment index within the word, as the corpus numbers it */
  g: number;
  case?: string;
  mood?: string;
  definiteness?: string;
  pgn?: string;
}

/**
 * Every inflectional feature the corpus marks on this word's segments.
 *
 * A word is often several segments -- a prefix, a stem, a suffix -- and
 * they carry different features: in وَبِالْكِتَابِ the definite article is
 * its own segment, and the genitive is on the noun. Returning them per
 * segment keeps that visible instead of flattening it into one row that
 * would be wrong about both.
 */
export function segmentFeatures(
  morphology: MorphologyIndexFile,
  s: number,
  a: number,
  w: number,
): SegmentFeatures[] {
  const out: SegmentFeatures[] = [];
  for (let i = 0; i < morphology.s.length; i++) {
    if (morphology.s[i] !== s || morphology.a[i] !== a || morphology.w[i] !== w) continue;
    const row: SegmentFeatures = { g: morphology.g[i] };
    // Every feature column is 1-based into its vocabulary, 0 for absent
    // (build-morphology's firstOf). Decoded through the vocabularies
    // themselves rather than a copy of them, so the two cannot drift.
    if (morphology.c[i] > 0) row.case = MORPH_CASES[morphology.c[i] - 1];
    if (morphology.m[i] > 0) row.mood = MORPH_MOODS[morphology.m[i] - 1];
    if (morphology.d[i] > 0) row.definiteness = MORPH_DEFINITENESS[morphology.d[i] - 1];
    if (morphology.p[i] > 0) row.pgn = morphology.pgnTags[morphology.p[i] - 1];
    if (row.case || row.mood || row.definiteness || row.pgn) out.push(row);
  }
  return out.sort((x, y) => x.g - y.g);
}

/**
 * Trims a lexicon article's token stream to a readable excerpt.
 *
 * Counts only the visible characters, and always cuts on a token
 * boundary: the tokens are sigil-prefixed (see LaneEntry) and half a token
 * would render as the wrong kind of span, in the wrong script.
 */
export function excerptTokens(tokens: readonly string[], maxChars = 240): string[] {
  const out: string[] = [];
  let length = 0;
  for (const token of tokens) {
    out.push(token);
    length += token.length - 1;
    if (length >= maxChars) break;
  }
  return out;
}

export interface LexiconExcerpt {
  /** the work's key: "lane", "maqayis", "mufradat", "sihah" */
  work: string;
  headword: string;
  tokens: string[];
  /** true when the article continues past the excerpt */
  truncated: boolean;
}

/**
 * The opening of what each lexicon says about this root.
 *
 * One excerpt per work, from its first article: enough to tell a reader
 * whether the entry is worth opening, without moving them off the verse.
 * A missing lexicon file is not an error -- coverage is partial by nature
 * (see buildLane and buildMujam), and a root nobody covered simply has no
 * excerpt.
 */
export async function lexiconExcerpts(root: string, maxChars = 240): Promise<LexiconExcerpt[]> {
  const [lane, mujam] = await Promise.all([
    getLaneRoot(root).catch(() => null),
    getMujamRoot(root).catch(() => null),
  ]);

  const out: LexiconExcerpt[] = [];
  const laneArticle = lane?.articles?.[0];
  if (laneArticle) {
    const tokens = excerptTokens(laneArticle.tokens, maxChars);
    out.push({
      work: "lane",
      headword: laneArticle.headword,
      tokens,
      truncated: tokens.length < laneArticle.tokens.length,
    });
  }

  // In the order the lexicon panel shows them, which is the order the
  // build writes them; the meta file's list is not needed just to pick a
  // first article per work.
  const works: MujamWork["id"][] = ["maqayis", "mufradat", "sihah"];
  for (const work of works) {
    const entry = mujam?.entries?.find((e) => e.work === work);
    const article = entry?.articles?.[0];
    if (!article) continue;
    const tokens = excerptTokens(article.tokens, maxChars);
    out.push({
      work,
      headword: article.headword,
      tokens,
      truncated: tokens.length < article.tokens.length,
    });
  }
  return out;
}

/**
 * Is this root characteristic of the passage being read?
 *
 * The same log-likelihood the Compare tool uses (lib/stats/keyness), asked
 * of one root in one surah. It is the question a reader has while reading
 * and could previously only answer by leaving for /insights/ and setting
 * the scope by hand: this word is here -- is it unusually here?
 *
 * Counts in a single pass over verse-roots rather than through
 * compareScope, which scores all 1,651 roots; only one is wanted.
 */
export function rootKeynessInSurah(
  verseRoots: readonly (readonly (readonly [number, number])[])[],
  refs: readonly VerseRef[],
  surah: number,
  rootIdx: number,
): Keyness {
  let inside = 0;
  let outside = 0;
  let scopeTokens = 0;
  let referenceTokens = 0;
  const scope = { kind: "surah", n: surah } as const;

  const verses = Math.min(verseRoots.length, refs.length);
  for (let v = 0; v < verses; v++) {
    const isIn = inScope(scope, refs[v]);
    for (const [idx] of verseRoots[v]) {
      if (isIn) {
        scopeTokens += 1;
        if (idx === rootIdx) inside += 1;
      } else {
        referenceTokens += 1;
        if (idx === rootIdx) outside += 1;
      }
    }
  }
  return keyness({ a: inside, b: outside, c: scopeTokens, d: referenceTokens });
}

export interface WordDetail {
  features: SegmentFeatures[];
  lexicons: LexiconExcerpt[];
  surahKeyness: Keyness | null;
}

/**
 * Everything above, fetched together for one tapped word.
 *
 * Each part fails soft: a lexicon that does not cover this root, or a
 * morphology fetch that does not land, leaves its section out rather than
 * failing the panel that already showed the root and the lemma.
 */
export async function loadWordDetail(
  s: number,
  a: number,
  w: number,
  root: string,
  rootIdx: number,
): Promise<WordDetail> {
  const [morphology, lexicons, verseRoots, meta] = await Promise.all([
    getMorphologyIndex().catch(() => null),
    lexiconExcerpts(root),
    getVerseRoots().catch(() => null),
    getMeta().catch(() => null),
  ]);
  return {
    features: morphology ? segmentFeatures(morphology, s, a, w) : [],
    lexicons,
    surahKeyness:
      verseRoots && meta ? rootKeynessInSurah(verseRoots, buildVerseRefs(meta), s, rootIdx) : null,
  };
}
