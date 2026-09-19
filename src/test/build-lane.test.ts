import { describe, expect, it } from "vitest";
import {
  buildLane,
  encodeToken,
  laneCandidates,
  normalizeRoot,
  type RawLaneEntry,
} from "../../scripts/lib/build-lane";

function entries(root: string, ...xml: string[]): RawLaneEntry[] {
  return xml.map((x, i) => ({ root, word: `w${i}`, xml: x, page: 100 + i }));
}

describe("normalizeRoot", () => {
  it("folds the hamza forms this corpus writes but Lane does not", () => {
    expect(normalizeRoot("أله")).toBe("اله");
    expect(normalizeRoot("إمن")).toBe("امن");
    expect(normalizeRoot("مرأ")).toBe("مرا");
  });

  it("folds alif maqsura and ta marbuta", () => {
    expect(normalizeRoot("رمى")).toBe("رمي");
    expect(normalizeRoot("حمة")).toBe("حمه");
  });

  it("leaves an already-plain root untouched", () => {
    expect(normalizeRoot("كتب")).toBe("كتب");
  });
});

describe("laneCandidates", () => {
  it("contracts a geminate root, which is how Lane writes it", () => {
    // This corpus writes أبب; Lane writes اب. This single rule takes the
    // match rate from 87.8% to 97.9%.
    expect(laneCandidates("أبب")).toEqual(["ابب", "اب"]);
    expect(laneCandidates("برر")).toEqual(["برر", "بر"]);
  });

  it("contracts a reduplicated quadriliteral", () => {
    expect(laneCandidates("زلزل")).toContain("زل");
  });

  it("offers only the plain spelling for a sound root", () => {
    expect(laneCandidates("كتب")).toEqual(["كتب"]);
  });

  it("never substitutes a final weak letter", () => {
    // The tempting near-miss rule: دهق -> دهو, نتق -> نتا. Those are DIFFERENT
    // roots. Attaching their articles here would be a fabricated attribution.
    expect(laneCandidates("دهق")).toEqual(["دهق"]);
    expect(laneCandidates("نتق")).toEqual(["نتق"]);
    expect(laneCandidates("قسو")).toEqual(["قسو"]);
  });
});

describe("encodeToken", () => {
  it("prefixes each token type with its sigil", () => {
    expect(encodeToken({ t: "t", v: "He wrote" })).toBe("tHe wrote");
    expect(encodeToken({ t: "a", v: "كتب" })).toBe("aكتب");
    expect(encodeToken({ t: "e", v: "thus" })).toBe("ethus");
    expect(encodeToken({ t: "s", n: "2" })).toBe("s2");
    expect(encodeToken({ t: "pb", v: "2590" })).toBe("p2590");
    expect(encodeToken({ t: "trop" })).toBe("^");
  });
});

describe("buildLane", () => {
  const lane = new Map([
    ["كتب", entries("كتب", '<entryFree>He wrote <foreign lang="ar">كِتَابٌ</foreign></entryFree>')],
    ["اب", entries("اب", "<entryFree>A father.</entryFree>")],
  ]);

  it("matches a sound root directly", () => {
    const { files } = buildLane(lane, ["كتب"]);
    expect(files.get("كتب")!.laneRoot).toBe("كتب");
    expect(files.get("كتب")!.articles[0].tokens).toContain("aكِتَابٌ");
  });

  it("matches a geminate root through contraction, recording Lane's own spelling", () => {
    const { files } = buildLane(lane, ["أبب"]);
    const f = files.get("أبب")!;
    expect(f.root).toBe("أبب");
    expect(f.laneRoot).toBe("اب");
  });

  it("omits a root Lane does not cover instead of guessing a near match", () => {
    const { files, meta } = buildLane(lane, ["كتب", "كهف"]);
    expect(files.has("كهف")).toBe(false);
    expect(meta.uncoveredRoots).toEqual(["كهف"]);
  });

  it("reports real coverage rather than assuming completeness", () => {
    const { meta } = buildLane(lane, ["كتب", "أبب", "كهف", "جهل"]);
    expect(meta.coveredRoots).toBe(2);
    expect(meta.totalRoots).toBe(4);
    expect(meta.uncoveredRoots).toEqual(["جهل", "كهف"]);
  });

  it("treats a root whose articles all parse empty as uncovered", () => {
    const empty = new Map([["خخخ", entries("خخخ", "<entryFree>   </entryFree>")]]);
    const { files, meta } = buildLane(empty, ["خخخ"]);
    expect(files.has("خخخ")).toBe(false);
    expect(meta.uncoveredRoots).toEqual(["خخخ"]);
  });

  it("keeps every article for a root, with its headword and page", () => {
    const many = new Map([
      ["كتب", entries("كتب", "<entryFree>one</entryFree>", "<entryFree>two</entryFree>")],
    ]);
    const { files } = buildLane(many, ["كتب"]);
    expect(files.get("كتب")!.articles).toHaveLength(2);
    expect(files.get("كتب")!.articles[0].page).toBe(100);
    expect(files.get("كتب")!.articles[1].headword).toBe("w1");
  });

  it("names the lexicon and its author", () => {
    const { meta } = buildLane(lane, ["كتب"]);
    expect(meta.author).toContain("Lane");
    expect(meta.authorAr.length).toBeGreaterThan(0);
  });
});
