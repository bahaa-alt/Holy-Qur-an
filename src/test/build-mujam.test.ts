import { describe, expect, it } from "vitest";
import {
  MUJAM_SOURCE_TABLE,
  MUJAM_WORKS,
  buildMujam,
  mujamCandidates,
  normalizeMujamRoot,
  type RawMujamEntry,
} from "../../scripts/lib/build-mujam";

const entries = (o: Record<string, RawMujamEntry[]>) =>
  new Map<string, readonly RawMujamEntry[]>(Object.entries(o));

describe("normalizeMujamRoot", () => {
  it("strips the vocalisation these sources put on their headwords", () => {
    // The reason this exists separately from build-lane's normalizeRoot:
    // Lane's database headwords are bare, these are vowelled.
    expect(normalizeMujamRoot("رَحِمَ")).toBe("رحم");
    expect(normalizeMujamRoot("أَبَّ")).toBe("اب");
  });

  it("folds the hamza and weak-letter spellings apart the two sides use", () => {
    expect(normalizeMujamRoot("أمن")).toBe("امن");
    expect(normalizeMujamRoot("إله")).toBe("اله");
    expect(normalizeMujamRoot("رمى")).toBe("رمي");
    expect(normalizeMujamRoot("حياة")).toBe("حياه");
  });

  it("strips tatweel, which is decoration rather than a letter", () => {
    expect(normalizeMujamRoot("رحـــم")).toBe("رحم");
  });
});

describe("mujamCandidates", () => {
  it("offers the faithful spelling first", () => {
    expect(mujamCandidates("رحم")[0]).toBe("رحم");
  });

  it("contracts a doubled final radical, which is how these works print it", () => {
    expect(mujamCandidates("أبب")).toEqual(["ابب", "اب"]);
    expect(mujamCandidates("برر")).toEqual(["برر", "بر"]);
  });

  it("contracts a reduplicated quadriliteral", () => {
    expect(mujamCandidates("زلزل")).toEqual(["زلزل", "زل"]);
  });

  it("never substitutes a final weak letter", () => {
    // The tempting rule that is wrong: it maps دهق onto دهو and نتق onto
    // نتا, which are DIFFERENT roots. Attaching another root's article to
    // this one would be a fabricated attribution.
    expect(mujamCandidates("دهق")).toEqual(["دهق"]);
    expect(mujamCandidates("نتق")).toEqual(["نتق"]);
  });
});

describe("MUJAM_WORKS", () => {
  it("names an edition and an OpenITI attestation for every work", () => {
    // The whole reason these three were chosen over a larger but anonymous
    // text: a lexicon nobody can trace to a printed edition cannot be cited.
    for (const w of MUJAM_WORKS) {
      expect(w.edition, w.id).not.toBe("");
      expect(w.editionEn, w.id).not.toBe("");
      expect(w.openiti, w.id).toMatch(/^\d{4}[A-Za-z]+\.[A-Za-z]+\.[A-Za-z0-9]+-ara\d$/);
    }
  });

  it("ships only pre-1500 works, whose text is out of copyright", () => {
    for (const w of MUJAM_WORKS) {
      const ce = Number(w.died.match(/\/ (\d+) CE/)?.[1]);
      expect(ce, w.id).toBeLessThan(1500);
    }
  });

  it("has a distinct id per work, and its own source table", () => {
    expect(new Set(MUJAM_WORKS.map((w) => w.id)).size).toBe(MUJAM_WORKS.length);
    const tables = MUJAM_WORKS.map((w) => MUJAM_SOURCE_TABLE[w.id]);
    expect(tables.every(Boolean)).toBe(true);
    expect(new Set(tables).size).toBe(MUJAM_WORKS.length);
  });
});

describe("buildMujam", () => {
  const rows = entries({
    maqayis: [{ word: "رَحِمَ", meanings: "أصل واحد يدل على الرقة" }],
    mufradat: [{ word: "رحم", meanings: "الرحم: رحم المرأة" }],
    sihah: [{ word: "أَبَّ", meanings: "الأب: المرعى" }],
  });

  it("collects every work that covers a root into one shard", () => {
    const { files } = buildMujam(rows, ["رحم"]);
    const file = files.get("رحم")!;
    expect(file.entries.map((e) => e.work)).toEqual(["maqayis", "mufradat"]);
  });

  it("keeps the shipped order of works, not the order they matched in", () => {
    const { files } = buildMujam(rows, ["رحم"]);
    const order = files.get("رحم")!.entries.map((e) => e.work);
    const shipped = MUJAM_WORKS.map((w) => w.id).filter((id) => order.includes(id));
    expect(order).toEqual(shipped);
  });

  it("records the lexicon's own spelling only when it differs", () => {
    const { files } = buildMujam(rows, ["رحم", "أبب"]);
    expect(files.get("رحم")!.entries[0].spelling).toBeNull();
    // أبب normalises to ابب, but al-Sihah prints it contracted as اب
    expect(files.get("أبب")!.entries[0].spelling).toBe("اب");
  });

  it("counts coverage per work as well as overall", () => {
    const { meta } = buildMujam(rows, ["رحم", "أبب", "دهق"]);
    const by = Object.fromEntries(meta.works.map((w) => [w.id, w.coveredRoots]));
    expect(by).toEqual({ maqayis: 1, mufradat: 1, sihah: 1 });
    expect(meta.coveredRoots).toBe(2);
    expect(meta.totalRoots).toBe(3);
  });

  it("lists a root no work covers rather than inventing one", () => {
    const { meta, files } = buildMujam(rows, ["رحم", "دهق"]);
    expect(meta.uncoveredRoots).toEqual(["دهق"]);
    expect(files.has("دهق")).toBe(false);
  });

  it("sorts uncoveredRoots, so the file is stable across builds", () => {
    const { meta } = buildMujam(rows, ["نتق", "دهق", "زهزه"]);
    expect(meta.uncoveredRoots).toEqual([...meta.uncoveredRoots].sort());
  });

  it("keeps both articles when a work prints two under one root", () => {
    const two = entries({
      maqayis: [
        { word: "رحم", meanings: "الأول" },
        { word: "رَحِم", meanings: "الثاني" },
      ],
    });
    const { files } = buildMujam(two, ["رحم"]);
    expect(files.get("رحم")!.entries[0].articles.map((a) => a.headword)).toEqual(["رحم", "رَحِم"]);
  });

  it("skips a row whose body parses to nothing", () => {
    // An article that is only the editor's footnote leaves no author text,
    // and an empty article is worse than an absent one -- it reads as a
    // work having nothing to say about a root it simply does not cover.
    const empty = entries({ maqayis: [{ word: "رحم", meanings: "[[حاشية]]" }] });
    const { meta, files } = buildMujam(empty, ["رحم"]);
    expect(files.has("رحم")).toBe(false);
    expect(meta.uncoveredRoots).toEqual(["رحم"]);
  });

  it("skips blank rows without counting them as coverage", () => {
    const blank = entries({ maqayis: [{ word: "رحم", meanings: "   " }] });
    expect(buildMujam(blank, ["رحم"]).meta.coveredRoots).toBe(0);
  });

  it("ships no build-only fields in the metadata", () => {
    // Where the text was read from is a build detail; MUJAM_SOURCE_TABLE
    // holds it so nothing has to be stripped here.
    const { meta } = buildMujam(rows, ["رحم"]);
    for (const w of meta.works) expect(w).not.toHaveProperty("table");
  });
});
