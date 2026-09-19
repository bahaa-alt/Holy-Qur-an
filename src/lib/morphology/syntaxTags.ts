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
 * Lives in src/ rather than beside the build script that writes the index,
 * because the QCQL parser needs the same vocabulary to validate a bare tag
 * predicate and to list the valid tags when one is misspelled. One
 * definition, imported by both; the alternative was a copy in the app that
 * could drift from the copy in the pipeline.
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
