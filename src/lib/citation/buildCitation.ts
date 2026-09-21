import type { ManifestFile } from "@/lib/data/types";
import { VERSION_DOI } from "./doi";

export const APP_NAME = "Qur'anic Root & Word Research";

/**
 * The dataset version, without a duplicated "v".
 *
 * manifest.json writes its version as "v1", and this citation printed
 * `Dataset v${version}` -- so every citation copied from a root or word
 * page has been reading "Dataset vv1". Normalized here rather than at
 * each call site, and exported so the exporters print the same string.
 */
export function datasetLabel(version: string): string {
  return `v${version.replace(/^v/i, "")}`;
}

/**
 * What is being cited. Beyond a root or a word, a researcher needs to
 * cite the VIEW that produced a number -- a query, a grammar filter, a
 * keyness table -- because that is what another reader has to reproduce.
 */
export type CitationKind =
  | "root"
  | "word"
  | "verse"
  | "surah"
  | "topic"
  | "query"
  | "grammar"
  | "keyness"
  | "rhyme"
  | "collocations"
  | "cooccurrence"
  | "formulas"
  | "verseSimilarity"
  | "patterns";

const SUBJECT_LABEL: Record<CitationKind, string> = {
  root: "Root",
  word: "Word",
  verse: "Verse",
  surah: "Surah",
  topic: "Topic",
  query: "Query",
  grammar: "Grammar filter",
  keyness: "Keyness",
  rhyme: "Rhyme",
  collocations: "Collocations",
  cooccurrence: "Cooccurrence",
  verseSimilarity: "Verse similarity",
  patterns: "Patterns",
  formulas: "Formulas",
};

export interface CitationSubject {
  kind: CitationKind;
  label: string;
}

/**
 * Builds a plain-text citation string for a root or word page. `url` and
 * `accessedOn` are injected by the caller (rather than read from
 * `window`/`Date.now()` here) so this stays a pure, deterministic function.
 *
 * Carries the VERSION DOI, not the concept one. A citation exists so a
 * reader can check the claim, and a count is only checkable against the
 * build that produced it -- the concept DOI would resolve to whatever is
 * newest, which is the opposite of what a footnote needs. The dataset hash
 * pins the data; the version DOI pins the code that derived it from that
 * data. Both are needed, which is why both are here.
 */
export function buildCitation(
  subject: CitationSubject,
  manifest: Pick<ManifestFile, "version" | "builtAt" | "hash" | "reading">,
  url: string,
  accessedOn: Date = new Date(),
): string {
  const subjectLabel = SUBJECT_LABEL[subject.kind];
  const builtDate = new Date(manifest.builtAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const accessedDate = accessedOn.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // The reading is part of the citation, not decoration: a count or a
  // verse reference from this tool is only reproducible against the text it
  // was computed from, and a different canonical reading can put a word
  // under a different root entirely (see ManifestReading).
  const reading = `${manifest.reading.transmission}, ${manifest.reading.verseNumbering} numbering`;

  return (
    `${APP_NAME}. ${subjectLabel} ${subject.label}. ` +
    `Text: ${reading}. ` +
    `Dataset ${datasetLabel(manifest.version)} (built ${builtDate}, hash ${manifest.hash}). ` +
    `DOI ${VERSION_DOI}. ` +
    `Accessed ${accessedDate}. ${url}`
  );
}
