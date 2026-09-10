import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildTopicVerseMatches, topicSourceFileKey } from "@/lib/topics/buildTopicOccurrences";
import type { RootFile } from "@/lib/data/types";

// Root رحم with two distinct lemmas (رَّحْمَٰنِ "رحمن" and رَّحِيمِ "رحيم") both
// occurring in the SAME verse (1:1, exactly like the real basmala) --
// exercises rootedLemma filtering and same-verse word merging. Root كتب
// occurs in two different verses. Rootless particle "ب" gives a third,
// file-less-by-root source.
const ROWS = [
  "1:1:1:1\tبِ\tP\tP|PREF|LEM:ب",
  "1:1:3:2\tرَّحْمَٰنِ\tN\tROOT:رحم|LEM:رَحْمٰن|MS|GEN|ADJ",
  "1:1:4:2\tرَّحِيمِ\tN\tROOT:رحم|LEM:رَحِيم|MS|GEN|ADJ",
  "2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
  "2:79:3:1\tيَكْتُبُ\tV\tIMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:IND",
].join("\n");

function buildFixture() {
  const words = parseMorphologyTSV(ROWS);
  const { rootFiles, lemmaFiles } = buildRoots(words, {});
  const files = new Map<string, RootFile>();
  for (const [root, file] of rootFiles) files.set(`root:${root}`, file);
  for (const [key, file] of lemmaFiles) files.set(`lemma:${key}`, file);
  return files;
}

describe("topicSourceFileKey", () => {
  it("keys a root source by its root string", () => {
    expect(topicSourceFileKey({ kind: "root", root: "كتب" })).toBe("root:كتب");
  });

  it("keys a rootedLemma source by its owning root (the file it lives in)", () => {
    expect(topicSourceFileKey({ kind: "rootedLemma", root: "رحم", lemmaKey: "رحمن" })).toBe("root:رحم");
  });

  it("keys a rootlessLemma source by its lemma key", () => {
    expect(topicSourceFileKey({ kind: "rootlessLemma", lemmaKey: "ب" })).toBe("lemma:ب");
  });
});

describe("buildTopicVerseMatches", () => {
  it("matches every occurrence of a plain root source, across verses, in Quran order", () => {
    const files = buildFixture();
    const matches = buildTopicVerseMatches([{ kind: "root", root: "كتب" }], files);
    expect(matches).toEqual([
      { s: 2, a: 2, words: [2] },
      { s: 2, a: 79, words: [3] },
    ]);
  });

  it("filters a rootedLemma source to just that lemma's words within the shared root", () => {
    const files = buildFixture();
    const rahman = buildTopicVerseMatches([{ kind: "rootedLemma", root: "رحم", lemmaKey: "رحمن" }], files);
    expect(rahman).toEqual([{ s: 1, a: 1, words: [3] }]);

    const rahim = buildTopicVerseMatches([{ kind: "rootedLemma", root: "رحم", lemmaKey: "رحيم" }], files);
    expect(rahim).toEqual([{ s: 1, a: 1, words: [4] }]);
  });

  it("merges multiple sources landing in the same verse into one match with all words", () => {
    const files = buildFixture();
    const matches = buildTopicVerseMatches(
      [
        { kind: "rootedLemma", root: "رحم", lemmaKey: "رحمن" },
        { kind: "rootedLemma", root: "رحم", lemmaKey: "رحيم" },
      ],
      files,
    );
    expect(matches).toEqual([{ s: 1, a: 1, words: [3, 4] }]);
  });

  it("resolves a rootlessLemma source from the lemma file map", () => {
    const files = buildFixture();
    const matches = buildTopicVerseMatches([{ kind: "rootlessLemma", lemmaKey: "ب" }], files);
    expect(matches).toEqual([{ s: 1, a: 1, words: [1] }]);
  });

  it("unions sources from entirely different files, sorted in Quran order", () => {
    const files = buildFixture();
    const matches = buildTopicVerseMatches(
      [{ kind: "root", root: "كتب" }, { kind: "rootlessLemma", lemmaKey: "ب" }],
      files,
    );
    expect(matches.map((m) => `${m.s}:${m.a}`)).toEqual(["1:1", "2:2", "2:79"]);
  });

  it("silently skips a source whose file is missing from the map", () => {
    const matches = buildTopicVerseMatches([{ kind: "root", root: "زوج" }], new Map());
    expect(matches).toEqual([]);
  });

  it("returns an empty array for no sources", () => {
    expect(buildTopicVerseMatches([], buildFixture())).toEqual([]);
  });
});
