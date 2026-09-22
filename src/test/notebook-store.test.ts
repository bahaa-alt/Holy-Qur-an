import { beforeEach, describe, expect, it } from "vitest";
import {
  addDerivedSet,
  addQuerySet,
  createStudy,
  deleteStudy,
  exportStudyJson,
  getStudies,
  getStudy,
  importStudyJson,
  removeSet,
  renameStudy,
  updateSetLabel,
  updateSetNote,
  updateStudyNotes,
} from "@/lib/notebook/store";

/** Same stand-in as notes-import.test.ts -- see its comment. */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
});

describe("createStudy / getStudy / getStudies", () => {
  it("creates an empty study and lists studies most-recently-updated first", () => {
    const a = createStudy("First");
    const b = createStudy("Second");
    expect(getStudy(a.id)).toMatchObject({ title: "First", sets: [] });
    expect(getStudies().map((s) => s.id)).toEqual([b.id, a.id]);
  });
});

describe("addQuerySet / addDerivedSet", () => {
  it("adds a query set to the study", () => {
    const study = createStudy("S");
    const set = addQuerySet(study.id, "علم", "[root=علم]")!;
    expect(getStudy(study.id)?.sets).toHaveLength(1);
    expect(getStudy(study.id)?.sets[0]).toMatchObject({ id: set.id, label: "علم" });
  });

  it("refuses a derived set that references an id not in the study", () => {
    const study = createStudy("S");
    const a = addQuerySet(study.id, "A", "[root=علم]")!;
    expect(addDerivedSet(study.id, "bad", "intersect", a.id, "nope")).toBeUndefined();
    expect(getStudy(study.id)?.sets).toHaveLength(1);
  });

  it("adds a derived set once both of its inputs exist", () => {
    const study = createStudy("S");
    const a = addQuerySet(study.id, "A", "[root=علم]")!;
    const b = addQuerySet(study.id, "B", "[root=كتب]")!;
    const c = addDerivedSet(study.id, "A∩B", "intersect", a.id, b.id)!;
    expect(getStudy(study.id)?.sets.map((s) => s.id)).toEqual([a.id, b.id, c.id]);
    expect(c.source).toEqual({ kind: "op", op: "intersect", left: a.id, right: b.id });
  });
});

describe("removeSet", () => {
  it("cascades to every set derived from the one removed, directly or transitively", () => {
    const study = createStudy("S");
    const a = addQuerySet(study.id, "A", "[root=علم]")!;
    const b = addQuerySet(study.id, "B", "[root=كتب]")!;
    const c = addDerivedSet(study.id, "A∩B", "intersect", a.id, b.id)!;
    const d = addDerivedSet(study.id, "C∪B", "union", c.id, b.id)!;
    removeSet(study.id, a.id);
    const remaining = getStudy(study.id)!.sets.map((s) => s.id);
    expect(remaining).toEqual([b.id]);
    expect(remaining).not.toContain(c.id);
    expect(remaining).not.toContain(d.id);
  });

  it("leaves sets that do not depend on the removed one alone", () => {
    const study = createStudy("S");
    const a = addQuerySet(study.id, "A", "[root=علم]")!;
    const b = addQuerySet(study.id, "B", "[root=كتب]")!;
    removeSet(study.id, a.id);
    expect(getStudy(study.id)!.sets.map((s) => s.id)).toEqual([b.id]);
  });
});

describe("renameStudy / updateStudyNotes / updateSetNote / updateSetLabel", () => {
  it("updates each field in place", () => {
    const study = createStudy("S");
    const a = addQuerySet(study.id, "A", "[root=علم]")!;
    renameStudy(study.id, "Renamed");
    updateStudyNotes(study.id, "some prose");
    updateSetNote(study.id, a.id, "a note");
    updateSetLabel(study.id, a.id, "relabelled");
    const reloaded = getStudy(study.id)!;
    expect(reloaded.title).toBe("Renamed");
    expect(reloaded.notes).toBe("some prose");
    expect(reloaded.sets[0]).toMatchObject({ label: "relabelled", note: "a note" });
  });
});

describe("deleteStudy", () => {
  it("removes the study entirely", () => {
    const study = createStudy("S");
    deleteStudy(study.id);
    expect(getStudy(study.id)).toBeUndefined();
  });
});

describe("exportStudyJson / importStudyJson", () => {
  it("round-trips a study's sets under a fresh id, without touching the original", () => {
    const study = createStudy("S");
    const a = addQuerySet(study.id, "A", "[root=علم]")!;
    const b = addQuerySet(study.id, "B", "[root=كتب]")!;
    addDerivedSet(study.id, "A∩B", "intersect", a.id, b.id);
    const json = exportStudyJson(getStudy(study.id)!);

    const imported = importStudyJson(json);
    expect(imported.id).not.toBe(study.id);
    expect(imported.title).toBe("S");
    expect(imported.sets).toHaveLength(3);
    expect(getStudy(study.id)?.sets).toHaveLength(3);
    expect(getStudies().map((s) => s.id).sort()).toEqual([study.id, imported.id].sort());
  });

  it("rejects malformed input by name", () => {
    expect(() => importStudyJson("{ not json")).toThrow(/not-json/);
    expect(() => importStudyJson(JSON.stringify({ hello: "world" }))).toThrow(/not-a-study/);
  });

  it("drops a set that references an id absent from the file", () => {
    const json = JSON.stringify({
      format: "qrr-study-v1",
      study: {
        title: "S",
        notes: "",
        sets: [
          { id: "a", label: "A", note: "", source: { kind: "query", qcql: "[root=علم]" } },
          {
            id: "b",
            label: "bad",
            note: "",
            source: { kind: "op", op: "intersect", left: "a", right: "missing" },
          },
        ],
      },
    });
    const imported = importStudyJson(json);
    expect(imported.sets.map((s) => s.id)).toEqual(["a"]);
  });

  it("drops sets on a reference cycle rather than importing an infinite loop", () => {
    const json = JSON.stringify({
      format: "qrr-study-v1",
      study: {
        title: "S",
        notes: "",
        sets: [
          { id: "a", label: "A", note: "", source: { kind: "op", op: "union", left: "b", right: "b" } },
          { id: "b", label: "B", note: "", source: { kind: "op", op: "union", left: "a", right: "a" } },
          { id: "c", label: "C", note: "", source: { kind: "query", qcql: "[root=علم]" } },
        ],
      },
    });
    const imported = importStudyJson(json);
    expect(imported.sets.map((s) => s.id)).toEqual(["c"]);
  });
});
