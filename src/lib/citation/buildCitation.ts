import type { ManifestFile } from "@/lib/data/types";
import { VERSION_DOI, VERSION_TAG } from "./doi";

export const APP_NAME = "Qur'anic Root & Word Research";

/** The only author record this project has (see CITATION.cff): a given name, no family name. */
export const AUTHOR_NAME = "Bahaa";

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
  | "patterns"
  | "letters"
  | "study";

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
  letters: "Letter frequency",
  study: "Study",
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

/** The fields every machine-readable exporter below needs, resolved once so they can't drift apart. */
interface CitationFields {
  title: string;
  year: number;
  isoDate: string;
  doi: string;
  url: string;
  version: string;
  note: string;
}

function resolveFields(
  subject: CitationSubject,
  manifest: Pick<ManifestFile, "version" | "builtAt" | "hash" | "reading">,
  url: string,
): CitationFields {
  const reading = `${manifest.reading.transmission}, ${manifest.reading.verseNumbering} numbering`;
  const builtAt = new Date(manifest.builtAt);
  return {
    title: `${APP_NAME}: ${SUBJECT_LABEL[subject.kind]} ${subject.label}`,
    year: builtAt.getUTCFullYear(),
    isoDate: manifest.builtAt.slice(0, 10),
    doi: VERSION_DOI,
    url,
    version: datasetLabel(manifest.version),
    note: `Text: ${reading}. Dataset ${datasetLabel(manifest.version)} (built ${builtAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}, hash ${manifest.hash}).`,
  };
}

/** A BibTeX field value, with the characters BibTeX treats specially escaped. */
function bibTexEscape(value: string): string {
  return value.replace(/[&%$#_{}~^\\]/g, (ch) => `\\${ch}`);
}

/** A stable-ish, ASCII-only citation key: author + year + a slug of the subject label. Also used as a download filename stem. */
export function citationKey(subject: CitationSubject, year: number): string {
  const slug =
    subject.label
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || subject.kind;
  return `bahaa${year}-qrr-${slug}`;
}

/**
 * A BibTeX `@software` entry (the biber/biblatex type for cited software and
 * datasets alike; plain BibTeX styles that don't know it fall back to
 * treating it as `@misc`, which is also a reasonable rendering here).
 */
export function buildBibTeX(
  subject: CitationSubject,
  manifest: Pick<ManifestFile, "version" | "builtAt" | "hash" | "reading">,
  url: string,
): string {
  const f = resolveFields(subject, manifest, url);
  const key = citationKey(subject, f.year);
  const lines = [
    `@software{${key},`,
    `  author       = {${bibTexEscape(AUTHOR_NAME)}},`,
    `  title        = {${bibTexEscape(f.title)}},`,
    `  year         = {${f.year}},`,
    `  publisher    = {Zenodo},`,
    `  version      = {${VERSION_TAG}},`,
    `  doi          = {${f.doi}},`,
    `  url          = {${f.url}},`,
    `  note         = {${bibTexEscape(f.note)}},`,
    `}`,
  ];
  return lines.join("\n") + "\n";
}

/** RIS (Research Information Systems): the fielded format Zotero, EndNote and Mendeley all import. */
export function buildRIS(
  subject: CitationSubject,
  manifest: Pick<ManifestFile, "version" | "builtAt" | "hash" | "reading">,
  url: string,
): string {
  const f = resolveFields(subject, manifest, url);
  const lines = [
    `TY  - COMP`,
    `AU  - ${AUTHOR_NAME}`,
    `TI  - ${f.title}`,
    `PY  - ${f.year}`,
    `PB  - Zenodo`,
    `DO  - ${f.doi}`,
    `UR  - ${f.url}`,
    `N1  - ${f.note}`,
    `ER  - `,
  ];
  return lines.join("\n") + "\n";
}

/** CSL-JSON: the format citeproc, Zotero and Pandoc read directly, as a one-item array. */
export function buildCslJson(
  subject: CitationSubject,
  manifest: Pick<ManifestFile, "version" | "builtAt" | "hash" | "reading">,
  url: string,
): string {
  const f = resolveFields(subject, manifest, url);
  const [y, m, d] = f.isoDate.split("-").map(Number);
  const entry = {
    id: citationKey(subject, f.year),
    type: "software",
    title: f.title,
    author: [{ given: AUTHOR_NAME }],
    issued: { "date-parts": [[y, m, d]] },
    DOI: f.doi,
    URL: f.url,
    version: f.version,
    publisher: "Zenodo",
    note: f.note,
  };
  return JSON.stringify([entry], null, 2) + "\n";
}
