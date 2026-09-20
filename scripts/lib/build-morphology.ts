import type { MorphologyIndexFile } from "../../src/lib/data/types";
import {
  MORPH_CASES,
  MORPH_DEFINITENESS,
  MORPH_MOODS,
  PGN_PATTERN,
} from "../../src/lib/morphology/morphFeatures";
import type { RawWord } from "./parse-morphology";

/**
 * Builds the corpus-wide index of inflectional features.
 *
 * WHY THIS EXISTS, GIVEN syntax.json ALREADY DOES SOMETHING LIKE IT.
 * build-syntax.ts indexes what a segment DOES in the sentence -- restriction,
 * condition, prohibition. This indexes what a segment IS: its case, mood,
 * definiteness and person-gender-number. The corpus marks both on the same
 * segments, and neither was queryable: `Cat` and verb Form made it into
 * occurrences.json, and everything else was readable only one word at a
 * time, on the word's own page.
 *
 * So "every jussive", "every accusative indefinite", "every 2nd-person
 * feminine plural verb" were all unanswerable, and they are the ordinary
 * questions of Arabic grammar.
 *
 * ONE ROW PER SEGMENT, FOUR FEATURE COLUMNS -- not one row per (segment,
 * tag) as syntax.json uses. A segment routinely carries several of these at
 * once (a verb is imperfect AND indicative AND 3MS), so a row per tag
 * would triple the row count to say the same thing. Measured on the real
 * corpus:
 * 102,244 rows, 1.83 MB raw / 174 KB gzipped.
 *
 * 0 MEANS ABSENT in every feature column, and absence is common and
 * meaningful: a particle has no case, a perfect verb has no mood. Runs of
 * zeros also compress to almost nothing, which is most of why the columnar
 * shape is worth it.
 *
 * ROOTLESS SEGMENTS ARE INCLUDED, and must be. Definiteness lives on the
 * ال prefix, which carries no root, so an index restricted to rooted
 * segments could not answer "every definite noun" at all -- the same reason
 * syntax.json is not restricted either.
 */
export function buildMorphology(words: readonly RawWord[]): MorphologyIndexFile {
  const pgnTags: string[] = [];
  const index: MorphologyIndexFile = {
    pgnTags,
    s: [],
    a: [],
    w: [],
    g: [],
    c: [],
    m: [],
    d: [],
    p: [],
  };

  for (const word of words) {
    for (const seg of word.segments) {
      const c = firstOf(seg.tags, MORPH_CASES);
      // The corpus writes mood as MOOD:JUS, not JUS. The vocabulary holds
      // the bare value because that is what a query and a label use
      // (mood=jus); the prefix is the source's spelling, not ours.
      const m = firstOf(seg.tags, MORPH_MOODS, "MOOD:");
      const d = firstOf(seg.tags, MORPH_DEFINITENESS);

      const pgnTag = seg.tags.find((t) => PGN_PATTERN.test(t));
      let p = 0;
      if (pgnTag !== undefined) {
        let at = pgnTags.indexOf(pgnTag);
        if (at === -1) {
          pgnTags.push(pgnTag);
          at = pgnTags.length - 1;
        }
        p = at + 1;
      }

      // A segment with none of the four is most of the corpus's particles
      // and prefixes; indexing them would add rows that answer nothing.
      if (c === 0 && m === 0 && d === 0 && p === 0) continue;

      index.s.push(seg.s);
      index.a.push(seg.a);
      index.w.push(seg.w);
      index.g.push(seg.seg);
      index.c.push(c);
      index.m.push(m);
      index.d.push(d);
      index.p.push(p);
    }
  }

  // Sorted so a tag's id is stable across builds; the ids stored in `p` are
  // remapped to match rather than left in first-seen order.
  const sorted = [...pgnTags].sort();
  if (sorted.join("\u0000") !== pgnTags.join("\u0000")) {
    const remap = new Map(pgnTags.map((t, i) => [i + 1, sorted.indexOf(t) + 1]));
    for (let i = 0; i < index.p.length; i++) {
      if (index.p[i] !== 0) index.p[i] = remap.get(index.p[i])!;
    }
    index.pgnTags = sorted;
  }

  return index;
}

/**
 * 1-based position of the first vocabulary value the segment carries, or 0.
 *
 * `prefix` bridges the gap between how the corpus spells a feature and how
 * this project names it -- see the MOOD: call site.
 */
function firstOf(tags: readonly string[], vocabulary: readonly string[], prefix = ""): number {
  for (let i = 0; i < vocabulary.length; i++) {
    if (tags.includes(prefix + vocabulary[i])) return i + 1;
  }
  return 0;
}
