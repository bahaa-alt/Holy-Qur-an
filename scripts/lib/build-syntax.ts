import type { SyntaxIndexFile } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

/**
 * The syntactic / rhetorical tag vocabulary.
 *
 * The corpus tags every segment with a mix of three different kinds of
 * thing: part of speech (N, V, P, PN...), pure morphology (case NOM/ACC/GEN,
 * person-gender-number 3MS/2FP, aspect PERF/IMPF, mood, verb Form), and the
 * segment's FUNCTION in the sentence or in the rhetoric (restriction,
 * condition, circumstantial ḥāl, prohibition, oath...). Only the third kind
 * is listed here: the app already surfaces the first two through `Cat`,
 * FormsTable and ConjugationTable, and it is the third that nothing in the
 * app could previously query.
 *
 * PASS (passive voice) is included even though it is a property of a verb
 * rather than a particle: it is the one voice distinction the corpus marks,
 * it is invisible to `classify()`, and "find every passive construction" is
 * a first-order research question. See SyntaxIndexFile for why it is a tag
 * here rather than a new `Cat`.
 *
 * Every tag below has an EN + AR label in src/lib/morphology/tagLabels.ts;
 * `src/test/build-syntax.test.ts` and the pipeline's own assertion keep the
 * two in step, so a tag added here without a label fails loudly.
 *
 * Sorted, so a tag's index in this array -- which is what SyntaxIndexFile.t
 * stores -- is stable across builds and across additions to the middle of
 * the list.
 */
export const SYNTAX_TAGS: readonly string[] = [
  "ADDR", // vocative addressee (أي)
  "AMD", // concessive (لكنّ)
  "ANS", // answer / response
  "ATT", // attention (ألا)
  "AVR", // aversion (كلّا)
  "CAUS", // causative
  "CERT", // certainty (قد)
  "CIRC", // circumstantial wāw (ḥāl)
  "COM", // comitative
  "COND", // conditional
  "EMPH", // emphatic lām
  "EQ", // equalization (سواء)
  "EXH", // exhortation
  "EXL", // explanation
  "EXP", // exceptive
  "FUT", // future (س / سوف)
  "INC", // inceptive
  "INT", // interpretation (أي)
  "INTG", // interrogative
  "NEG", // negation
  "PASS", // passive voice
  "PREV", // preventive (ما الكافّة)
  "PRO", // prohibition
  "PRP", // purpose lām
  "RES", // restriction (ḥaṣr): إنّما، إلّا
  "REM", // resumption (istiʾnāf)
  "RET", // retraction (بل)
  "RSLT", // result
  "SUB", // subordinating
  "SUP", // supplemental
  "SUR", // surprise (إذا الفجائية)
  "T", // time adverb
  "VOC", // vocative
]
  .slice()
  .sort();

const TAG_TO_IDX = new Map(SYNTAX_TAGS.map((t, i) => [t, i]));

/**
 * Builds the corpus-wide syntactic index: one row per segment carrying
 * exactly one SYNTAX_TAGS tag, in corpus (s, a, w, seg) order.
 *
 * Unlike every other index in this pipeline, this one is dominated by
 * ROOTLESS segments -- particles the app's "occurrence = rooted segment"
 * rule excludes by definition. That exclusion is correct for root counts
 * and wrong for grammar, which is why this exists as a parallel layer. See
 * SyntaxIndexFile for the full rationale and the encoding trade-offs.
 *
 * Throws if any segment carries two syntactic tags. That never happens in
 * the corpus today, and the one-tag-per-row encoding depends on it, so a
 * corpus that breaks the assumption must fail the build rather than
 * silently lose the second tag.
 */
export function buildSyntax(words: readonly RawWord[]): SyntaxIndexFile {
  const index: SyntaxIndexFile = { tags: [...SYNTAX_TAGS], s: [], a: [], w: [], g: [], t: [] };

  for (const word of words) {
    for (const seg of word.segments) {
      let found: string | null = null;
      for (const tag of seg.tags) {
        if (!TAG_TO_IDX.has(tag)) continue;
        if (found !== null) {
          throw new Error(
            `Segment ${seg.s}:${seg.a}:${seg.w}:${seg.seg} carries two syntactic tags ` +
              `(${found}, ${tag}); SyntaxIndexFile's one-tag-per-row encoding cannot represent it.`,
          );
        }
        found = tag;
      }
      if (found === null) continue;

      index.s.push(seg.s);
      index.a.push(seg.a);
      index.w.push(seg.w);
      index.g.push(seg.seg);
      index.t.push(TAG_TO_IDX.get(found)!);
    }
  }

  return index;
}
