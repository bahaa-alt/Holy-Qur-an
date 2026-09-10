import { buildOccurrenceRows, filterRows } from "@/lib/root/occurrences";
import type { RootFile } from "@/lib/data/types";
import type { TopicSource } from "./topicDefinitions";

export interface TopicVerseMatch {
  s: number;
  a: number;
  /** sorted, deduped 1-based word indices matched by this topic in this verse */
  words: number[];
}

/** The key a source's backing file is stored under in the `files` map passed to {@link buildTopicVerseMatches}. */
export function topicSourceFileKey(source: TopicSource): string {
  return source.kind === "rootlessLemma" ? `lemma:${source.lemmaKey}` : `root:${source.root}`;
}

/**
 * Combines every source's occurrences into one list of matched verses, in
 * Quran order. A verse matched by two different sources (e.g. two roots in
 * the same theme) is counted once, with every matched word carried in
 * `words` for highlighting -- unlike a single root/lemma page, a topic has
 * no one "the root" to highlight every occurrence of, so this tracks
 * exactly which words matched.
 *
 * `files` must already contain, keyed by {@link topicSourceFileKey}, the
 * RootFile each source resolves to (a root's own file, or the file of the
 * root that a `rootedLemma` source's lemma lives in) -- callers fetch
 * these however suits their context (readRootFile/readLemmaFile at build
 * time; getRoot/getLemma at runtime). A source whose file is missing from
 * the map is silently skipped, so a typo elsewhere fails via the
 * topicDefinitions corpus-existence test, not a silent partial result here.
 */
export function buildTopicVerseMatches(
  sources: readonly TopicSource[],
  files: ReadonlyMap<string, RootFile>,
): TopicVerseMatch[] {
  const byVerse = new Map<string, { s: number; a: number; words: Set<number> }>();

  for (const source of sources) {
    const file = files.get(topicSourceFileKey(source));
    if (!file) continue;

    let rows = buildOccurrenceRows(file);
    if (source.kind === "rootedLemma") {
      rows = filterRows(rows, { lemmaKey: source.lemmaKey });
    }

    for (const row of rows) {
      const key = `${row.s}:${row.a}`;
      let entry = byVerse.get(key);
      if (!entry) {
        entry = { s: row.s, a: row.a, words: new Set() };
        byVerse.set(key, entry);
      }
      entry.words.add(row.w);
    }
  }

  return [...byVerse.values()]
    .map((e) => ({ s: e.s, a: e.a, words: [...e.words].sort((x, y) => x - y) }))
    .sort((x, y) => x.s - y.s || x.a - y.a);
}
