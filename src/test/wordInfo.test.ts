import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { findWordRootIdx, resolveWordInfo } from "@/lib/word/wordInfo";
import type { IndexFile, VerseRootsFile } from "@/lib/data/types";

const ROWS = [
  "2:2:2:1\tٱلْ\tP\tDET|PREF|LEM:ال",
  "2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
  "2:79:3:1\tيَكْتُبُ\tV\tIMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:IND",
  "1:1:3:2\tرَّحْمَٰنِ\tN\tROOT:رحم|LEM:رَحْمٰن|MS|GEN|ADJ",
].join("\n");

function buildFixture() {
  const words = parseMorphologyTSV(ROWS);
  const { indexRoots, indexLemmas, rootFiles } = buildRoots(words, {});
  const index: IndexFile = { roots: indexRoots, lemmas: indexLemmas };
  const katabaFile = rootFiles.get("كتب")!;
  const rahmFile = rootFiles.get("رحم")!;

  // A small VerseRootsFile: global id 0 -> 1:1 (رحم at word 3), global id 1
  // -> 2:2 (كتب at word 2), global id 2 -> 2:79 (كتب at word 3).
  const katabaIdx = index.roots.findIndex((r) => r.ar === "كتب");
  const rahmIdx = index.roots.findIndex((r) => r.ar === "رحم");
  const verseRoots: VerseRootsFile = [
    [[rahmIdx, 3]],
    [[katabaIdx, 2]],
    [[katabaIdx, 3]],
  ];

  return { index, katabaFile, rahmFile, katabaIdx, rahmIdx, verseRoots };
}

describe("findWordRootIdx", () => {
  it("finds the root index for a word that has one", () => {
    const { verseRoots, katabaIdx } = buildFixture();
    expect(findWordRootIdx(verseRoots, 1, 2)).toBe(katabaIdx);
  });

  it("returns null for a word position with no root in that verse", () => {
    const { verseRoots } = buildFixture();
    expect(findWordRootIdx(verseRoots, 1, 1)).toBeNull(); // word 1 of 2:2 is "ٱلْ", a particle
  });

  it("returns null for a verse with no entry at all", () => {
    const { verseRoots } = buildFixture();
    expect(findWordRootIdx(verseRoots, 99, 1)).toBeNull();
  });
});

describe("resolveWordInfo", () => {
  it("resolves the lemma, category, and counts for a noun occurrence", () => {
    const { index, katabaFile, katabaIdx } = buildFixture();
    const indexRootRow = index.roots[katabaIdx];
    const info = resolveWordInfo(katabaFile, indexRootRow, index, katabaIdx, 2, 2, 2);
    expect(info).not.toBeNull();
    expect(info!.rootAr).toBe("كتب");
    expect(info!.lemma).toBe("كِتاب");
    expect(info!.cat).toBe("noun");
    expect(info!.rootTotal).toBe(indexRootRow.count);
  });

  it("resolves a verb occurrence of the same root separately from the noun", () => {
    const { index, katabaFile, katabaIdx } = buildFixture();
    const indexRootRow = index.roots[katabaIdx];
    const info = resolveWordInfo(katabaFile, indexRootRow, index, katabaIdx, 2, 79, 3);
    expect(info).not.toBeNull();
    expect(info!.lemma).toBe("كَتَبَ");
    expect(info!.cat).toBe("verb.impf");
    expect(info!.tagsJoined).toContain("MOOD:IND");
  });

  it("carries the occurrence's raw grammar tags for the noun too", () => {
    const { index, katabaFile, katabaIdx } = buildFixture();
    const indexRootRow = index.roots[katabaIdx];
    const info = resolveWordInfo(katabaFile, indexRootRow, index, katabaIdx, 2, 2, 2);
    expect(info!.tagsJoined).toBe("M|NOM");
  });

  it("resolves the correct global lemma index for use in a /word/{idx}/ link", () => {
    const { index, katabaFile, katabaIdx } = buildFixture();
    const indexRootRow = index.roots[katabaIdx];
    const info = resolveWordInfo(katabaFile, indexRootRow, index, katabaIdx, 2, 2, 2);
    expect(info!.globalLemmaIdx).toBeGreaterThanOrEqual(0);
    expect(index.lemmas[info!.globalLemmaIdx].lemma).toBe("كِتاب");
  });

  it("returns null when the (s,a,w) tuple isn't actually in that root's file", () => {
    const { index, katabaFile, katabaIdx } = buildFixture();
    const indexRootRow = index.roots[katabaIdx];
    expect(resolveWordInfo(katabaFile, indexRootRow, index, katabaIdx, 3, 3, 3)).toBeNull();
  });

  it("resolves an adjective occurrence from a different root correctly", () => {
    const { index, rahmFile, rahmIdx } = buildFixture();
    const indexRootRow = index.roots[rahmIdx];
    const info = resolveWordInfo(rahmFile, indexRootRow, index, rahmIdx, 1, 1, 3);
    expect(info).not.toBeNull();
    expect(info!.lemma).toBe("رَحْمٰن");
    expect(info!.cat).toBe("adj");
  });
});
