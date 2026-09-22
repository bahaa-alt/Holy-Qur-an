import { describe, expect, it } from "vitest";
import { topicToQcql } from "@/lib/topics/topicSourceToQcql";
import { parseQcql } from "@/lib/qcql/parse";
import type { TopicSource } from "@/lib/topics/topicDefinitions";

describe("topicToQcql", () => {
  it("builds a root predicate for a root source", () => {
    expect(topicToQcql([{ kind: "root", root: "علم" }])).toBe("[root=علم]");
  });

  it("builds a lemma predicate for both lemma-keyed source kinds", () => {
    expect(topicToQcql([{ kind: "rootedLemma", root: "عمر", lemmaKey: "اعتمر" }])).toBe(
      "[lemma=اعتمر]",
    );
    expect(topicToQcql([{ kind: "rootlessLemma", lemmaKey: "الذين" }])).toBe("[lemma=الذين]");
  });

  it("OR-joins several sources into one query", () => {
    const sources: TopicSource[] = [
      { kind: "root", root: "حجج" },
      { kind: "root", root: "طوف" },
      { kind: "rootedLemma", root: "عمر", lemmaKey: "عمره" },
    ];
    expect(topicToQcql(sources)).toBe("[root=حجج | root=طوف | lemma=عمره]");
  });

  it("produces a query the real QCQL parser accepts, for every source kind", () => {
    const sources: TopicSource[] = [
      { kind: "root", root: "رحم" },
      { kind: "rootedLemma", root: "صدق", lemmaKey: "تصدق" },
      { kind: "rootlessLemma", lemmaKey: "الذين" },
    ];
    expect(() => parseQcql(topicToQcql(sources))).not.toThrow();
  });
});
