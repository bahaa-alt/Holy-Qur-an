import { describe, expect, it } from "vitest";
import { ALL_FACETS, GRAMMAR_GROUPS } from "@/lib/grammar/facets";
import { en } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";
import { describeTag } from "@/lib/morphology/tagLabels";
import { SYNTAX_TAGS } from "@/lib/morphology/syntaxTags";
import { parseQcql } from "@/lib/qcql/parse";
import { needsMorphology } from "@/lib/qcql/types";

/**
 * The facets are data, not code, so what can be checked here is that every
 * one of them is well-formed: a query the parser accepts, an id nothing
 * else uses, a label in both languages. What they RETURN is a claim about
 * the corpus and is asserted in scripts/build-data.ts instead -- a unit
 * test that read public/data/v1 would not run on a fresh clone.
 */
describe("grammar facets", () => {
  it("gives every facet a unique id", () => {
    const ids = ALL_FACETS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers verbs, nouns and function tags", () => {
    expect(GRAMMAR_GROUPS.map((g) => g.labelKey)).toEqual(["verbs", "nouns", "function"]);
    const tagFacets = ALL_FACETS.filter((f) => f.tag);
    expect(tagFacets.length).toBe(SYNTAX_TAGS.length);
  });

  it("gives every facet a query the parser accepts", () => {
    for (const facet of ALL_FACETS) {
      expect(() => parseQcql(facet.q), `${facet.id}: ${facet.q}`).not.toThrow();
    }
  });

  it("labels every facet in both languages", () => {
    for (const facet of ALL_FACETS) {
      if (facet.tag) {
        // A tag facet takes its labels from tagLabels.ts, which echoes the
        // raw tag back when it knows none.
        expect(describeTag(facet.tag).en, facet.id).not.toBe(facet.tag);
        expect(describeTag(facet.tag).ar, facet.id).toBeTruthy();
      } else {
        expect(facet.en, facet.id).toBeTruthy();
        expect(facet.ar, facet.id).toBeTruthy();
      }
    }
  });

  it("names a group and a section heading that both dictionaries have", () => {
    for (const group of GRAMMAR_GROUPS) {
      expect(en.grammarPage.groups[group.labelKey]).toBeTruthy();
      expect(ar.grammarPage.groups[group.labelKey]).toBeTruthy();
      for (const section of group.sections) {
        expect(en.grammarPage.sections[section.labelKey]).toBeTruthy();
        expect(ar.grammarPage.sections[section.labelKey]).toBeTruthy();
      }
    }
  });

  it("reads morphology.json for exactly the inflectional facets", () => {
    // The browser fetches the 176 KB morphology index only when a facet
    // needs it, so which facets need it is worth pinning.
    const morph = ALL_FACETS.filter((f) => needsMorphology(parseQcql(f.q))).map((f) => f.id);
    expect(morph.filter((id) => id.startsWith("case-")).length).toBe(3);
    expect(morph.filter((id) => id.startsWith("mood-")).length).toBe(3);
    expect(morph.filter((id) => id.startsWith("def-")).length).toBe(2);
    expect(morph.filter((id) => id.startsWith("pgn-")).length).toBe(22);
    expect(morph.length).toBe(30);
    expect(morph).not.toContain("perf");
    expect(morph).not.toContain("tag-PASS");
  });
});
