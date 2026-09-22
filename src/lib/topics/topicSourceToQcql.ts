import type { TopicSource } from "./topicDefinitions";

/**
 * Translates one topic source into the QCQL predicate that finds the same
 * occurrences (see lib/qcql). A `root` source matches every occurrence of
 * that root regardless of lemma; both lemma-keyed sources narrow to one
 * lemma, which is what `lemma=` alone already means -- the root is
 * redundant on a `rootedLemma` source's own QCQL predicate.
 */
function predicateFor(source: TopicSource): string {
  switch (source.kind) {
    case "root":
      return `root=${source.root}`;
    case "rootedLemma":
    case "rootlessLemma":
      return `lemma=${source.lemmaKey}`;
  }
}

/**
 * Builds the QCQL query that reproduces a topic's verse list: every source
 * OR'd together, since a topic matches a verse containing ANY of its roots
 * or lemmas. This is what makes a topic (or a Names entry, which is the
 * same TopicDefinition shape) convertible into a Study set -- the topic's
 * curated sources become a query set a researcher can then combine with
 * others by intersect/union/subtract.
 */
export function topicToQcql(sources: readonly TopicSource[]): string {
  return `[${sources.map(predicateFor).join(" | ")}]`;
}
