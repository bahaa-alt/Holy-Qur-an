import { describe, expect, it } from "vitest";
import {
  ALL_TOPICS,
  COMMODITIES_TOPICS,
  COSMOLOGY_TOPICS,
  findTopicBySlug,
  GEOGRAPHY_TOPICS,
  GEOLOGY_TOPICS,
  METEOROLOGY_TOPICS,
  PEOPLE_TOPICS,
  PROPHET_TOPICS,
  SPECIES_TOPICS,
  THEME_TOPICS,
} from "@/lib/topics/topicDefinitions";

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
    expect(THEME_TOPICS.every((t) => t.category === "theme")).toBe(true);
    expect(PROPHET_TOPICS.every((t) => t.category === "prophet")).toBe(true);
    expect(PEOPLE_TOPICS.every((t) => t.category === "person")).toBe(true);
    expect(SPECIES_TOPICS.every((t) => t.category === "species")).toBe(true);
    expect(GEOGRAPHY_TOPICS.every((t) => t.category === "geography")).toBe(true);
    expect(GEOLOGY_TOPICS.every((t) => t.category === "geology")).toBe(true);
    expect(METEOROLOGY_TOPICS.every((t) => t.category === "meteorology")).toBe(true);
    expect(COSMOLOGY_TOPICS.every((t) => t.category === "cosmology")).toBe(true);
    expect(COMMODITIES_TOPICS.every((t) => t.category === "commodities")).toBe(true);
  });

  it("ALL_TOPICS is exactly the concatenation of every topic category array", () => {
    expect(ALL_TOPICS).toEqual([
      ...THEME_TOPICS,
      ...PROPHET_TOPICS,
      ...PEOPLE_TOPICS,
      ...SPECIES_TOPICS,
      ...GEOGRAPHY_TOPICS,
      ...GEOLOGY_TOPICS,
      ...METEOROLOGY_TOPICS,
      ...COSMOLOGY_TOPICS,
      ...COMMODITIES_TOPICS,
    ]);
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
