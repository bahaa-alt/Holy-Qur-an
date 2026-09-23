/**
 * English glosses for the treebank's relation codes (see
 * scripts/lib/build-treebank.ts). The Arabic name is already carried
 * per-entry (`relAr`, straight from the source); this covers only the
 * English side, for the ~40 relation codes that actually occur in the
 * Qur'an's text -- the source's full vocabulary also has ~100 "subj/pred of
 * a specific kāna-sister particle" codes (`subj <<kan>>`, `pred <<ykon>>`,
 * etc.), handled generically below rather than individually, since hand
 * glossing each of ~50 particles would add a lot of surface for little
 * benefit over just naming the particle.
 */
const REL_LABELS_EN: Record<string, string> = {
  root: "root of the sentence (no head)",
  NonRel: "non-relational (attached prefix)",
  gen: "genitive (after a preposition)",
  Pred: "predicate (khabar)",
  Adj: "qualifier (adjective)",
  cog: "cognate accusative (absolute object)",
  cert: "verification particle",
  Pass: "surrogate subject (of a passive verb)",
  state: "clarification",
  ans: "response / answer",
  neg: "negation",
  intg: "interrogative",
  sub: "relative clause",
  voc: "vocative",
  circ: "circumstantial (ḥāl)",
  prp: "purpose (object for its sake)",
  exp: "exception",
  sup: "augmentative (grammatically extra)",
  caus: "causal",
  conj: "conjoined (coordinated)",
  Spec: "specification (tamyīz)",
  fut: "future particle",
  res: "restriction",
  amd: "correction (rather)",
  link: "linked (governed by an implied element)",
  impv: "imperative",
  exl: "elaboration (detail)",
  Poss: "possessive (muḍāf ilayh)",
  emph: "emphasis",
  ret: "retraction (digression)",
  Cpnd: "compound",
  eq: "equalization",
  prev: "preventive particle",
  sur: "surprise particle",
  Subj: "subject",
  avr: "deterrent particle",
  rslt: "apodosis (conditional result)",
  imrs: "response to an imperative",
  int: "explanation",
  Pro: "prohibition",
  exh: "exhortation",
  inc: "topic (inceptive)",
  Obj: "direct object",
  cond: "conditional",
  App: "appositive",
};

const SUBJ_PRED_RE = /^(subj|pred)\s*<<(.+)>>$/;

/** The English gloss for a relation code, generic for the "subj/pred <<particle>>" family. */
export function relLabelEn(code: string): string {
  const known = REL_LABELS_EN[code];
  if (known) return known;
  const m = SUBJ_PRED_RE.exec(code);
  if (m) {
    const [, kind, particle] = m;
    return `${kind === "subj" ? "subject" : "predicate"} of "${particle}"`;
  }
  return code;
}
