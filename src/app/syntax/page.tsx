import {
  readIndex,
  readMeta,
  readMorphologyIndex,
  readOccurrenceIndex,
  readSyntaxIndex,
} from "@/lib/data/serverData";
import { SyntaxPageContent } from "@/components/syntax/SyntaxPageContent";
import type { FacetCounts } from "@/components/syntax/GrammarBrowser";
import { ALL_FACETS } from "@/lib/grammar/facets";
import { executeQcql, type QcqlCorpus } from "@/lib/qcql/execute";
import { parseQcql } from "@/lib/qcql/parse";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Syntax & rhetoric",
  alternates: { canonical: absoluteUrl("/syntax/") },
};

export default function SyntaxPage() {
  const syntax = readSyntaxIndex();
  const meta = readMeta();

  // Every chip's count, computed here (once, at build time) by running the
  // chip's own query -- the same parser and executor the client uses, so a
  // count can never disagree with the list it heads. This costs ~0.3s at
  // build and saves the reader the 176 KB morphology index on arrival: the
  // client fetches an index only when a chip that needs it is clicked.
  //
  // A facet that throws or returns nothing is a bug, not a finding, so this
  // does not swallow errors -- the build fails instead.
  const corpus: QcqlCorpus = {
    occurrences: readOccurrenceIndex(),
    syntax,
    index: readIndex(),
    surahs: meta.surahs,
    morphology: readMorphologyIndex(),
  };
  const counts: FacetCounts = {};
  for (const facet of ALL_FACETS) {
    counts[facet.id] = executeQcql(parseQcql(facet.q), corpus).matches.length;
  }

  return (
    <SyntaxPageContent surahs={meta.surahs} counts={counts} totalTaggedSegments={syntax.t.length} />
  );
}
