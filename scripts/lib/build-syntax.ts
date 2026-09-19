import type { SyntaxIndexFile } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";
import { SYNTAX_TAGS } from "../../src/lib/morphology/syntaxTags";

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
