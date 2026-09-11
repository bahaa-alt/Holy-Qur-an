import { describe, expect, it } from "vitest";
import {
  ALL_TOPICS,
  ANGEL_TOPICS,
  BOOK_TOPICS,
  COMMODITIES_TOPICS,
  COSMOLOGY_TOPICS,
  DIVINE_NAME_TOPICS,
  findTopicBySlug,
  GEOGRAPHY_TOPICS,
  GEOLOGY_TOPICS,
  METEOROLOGY_TOPICS,
  NUMBER_TOPICS,
  OBJECT_TOPICS,
  PEOPLE_TOPICS,
  PROPHET_TOPICS,
  SPECIES_TOPICS,
  THEME_TOPICS,
  type TopicDefinition,
} from "@/lib/topics/topicDefinitions";

// Every topic-category array, paired with the category value its topics
// must carry -- iterated over so this stays a one-line addition per new
// category instead of a hand-maintained list of near-duplicate assertions.
const CATEGORY_ARRAYS: readonly [TopicDefinition["category"], TopicDefinition[]][] = [
  ["theme", THEME_TOPICS],
  ["prophet", PROPHET_TOPICS],
  ["person", PEOPLE_TOPICS],
  ["species", SPECIES_TOPICS],
  ["geography", GEOGRAPHY_TOPICS],
  ["geology", GEOLOGY_TOPICS],
  ["meteorology", METEOROLOGY_TOPICS],
  ["cosmology", COSMOLOGY_TOPICS],
  ["commodities", COMMODITIES_TOPICS],
  ["object", OBJECT_TOPICS],
  ["book", BOOK_TOPICS],
  ["angel", ANGEL_TOPICS],
  ["number", NUMBER_TOPICS],
  ["divineName", DIVINE_NAME_TOPICS],
];

// Corpus-existence (does root/lemma "X" actually exist in this build?) is
// checked by scripts/build-data.ts itself, against the real built corpus --
// not repeated here, since a hermetic unit test shouldn't depend on
// public/data/v1 having been built. This file only asserts the definitions
// are internally well-formed.

describe("topicDefinitions", () => {
  it("has no duplicate slugs across every topic category", () => {
    const slugs = ALL_TOPICS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every topic has at least one source", () => {
    for (const topic of ALL_TOPICS) {
      expect(topic.sources.length, `topic "${topic.slug}"`).toBeGreaterThan(0);
    }
  });

  it("every topic has both an English and Arabic label", () => {
    for (const topic of ALL_TOPICS) {
      expect(topic.labelEn.length, `topic "${topic.slug}"`).toBeGreaterThan(0);
      expect(topic.labelAr.length, `topic "${topic.slug}"`).toBeGreaterThan(0);
    }
  });

  it("categorizes every topic array with its own matching category", () => {
    for (const [category, topics] of CATEGORY_ARRAYS) {
      expect(topics.every((t) => t.category === category), `category "${category}"`).toBe(true);
    }
  });

  it("ALL_TOPICS is exactly the concatenation of every topic category array", () => {
    expect(ALL_TOPICS).toEqual(CATEGORY_ARRAYS.flatMap(([, topics]) => topics));
  });

  it("rootedLemma sources carry both a root and a lemma key", () => {
    for (const topic of ALL_TOPICS) {
      for (const source of topic.sources) {
        if (source.kind === "rootedLemma") {
          expect(source.root.length, `topic "${topic.slug}"`).toBeGreaterThan(0);
          expect(source.lemmaKey.length, `topic "${topic.slug}"`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("findTopicBySlug", () => {
  it("finds a known theme and a known prophet by slug", () => {
    expect(findTopicBySlug("marriage")?.labelEn).toBe("Marriage");
    expect(findTopicBySlug("musa")?.labelEn).toContain("Moses");
  });

  it("returns undefined for an unknown slug", () => {
    expect(findTopicBySlug("not-a-real-topic")).toBeUndefined();
  });
});
