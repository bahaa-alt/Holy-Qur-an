import { beforeEach, describe, expect, it } from "vitest";
import { exportSaved, getSavedItems, importSaved, saveItem } from "@/lib/notes/store";

/**
 * The store talks to localStorage, which the node test environment does
 * not have, so these tests install the smallest possible stand-in. What
 * is under test is the merge and the validation, not the browser API.
 */
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

const notebook = (items: unknown[]) => JSON.stringify({ format: "qrr-saved-v1", items });

describe("exportSaved", () => {
  it("writes a notebook that importSaved reads back", () => {
    saveItem({ id: "root:كتب", kind: "root", label: "كتب", href: "/root/كتب/", note: "check" });
    const json = exportSaved();
    (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
    expect(getSavedItems()).toHaveLength(0);
    expect(importSaved(json)).toMatchObject({ added: 1, updated: 0, skipped: 0 });
    expect(getSavedItems()[0]).toMatchObject({ id: "root:كتب", note: "check" });
  });
});

describe("importSaved", () => {
  it("merges rather than replaces -- a second device keeps its own work", () => {
    saveItem({ id: "root:علم", kind: "root", label: "علم", href: "/root/علم/", note: "mine" });
    const result = importSaved(
      notebook([
        {
          id: "query:[PASS]",
          kind: "query",
          label: "[PASS]",
          href: "/query/?q=%5BPASS%5D",
          note: "",
        },
      ]),
    );
    expect(result.added).toBe(1);
    expect(
      getSavedItems()
        .map((i) => i.id)
        .sort(),
    ).toEqual(["query:[PASS]", "root:علم"]);
  });

  it("lets the later save win when both sides hold the same id", () => {
    saveItem({ id: "root:علم", kind: "root", label: "علم", href: "/root/علم/", note: "old" });
    const later = new Date(Date.now() + 60_000).toISOString();
    expect(
      importSaved(
        notebook([
          {
            id: "root:علم",
            kind: "root",
            label: "علم",
            href: "/root/علم/",
            note: "new",
            savedAt: later,
          },
        ]),
      ),
    ).toMatchObject({ added: 0, updated: 1 });
    expect(getSavedItems()[0].note).toBe("new");

    // ... and keeps the local one when the import is older.
    const earlier = new Date(Date.now() - 60_000).toISOString();
    expect(
      importSaved(
        notebook([
          {
            id: "root:علم",
            kind: "root",
            label: "علم",
            href: "/root/علم/",
            note: "stale",
            savedAt: earlier,
          },
        ]),
      ),
    ).toMatchObject({ updated: 0, skipped: 1 });
    expect(getSavedItems()[0].note).toBe("new");
  });

  it("refuses an href that is not an app path", () => {
    // The whole point: these become links someone clicks, and an imported
    // file is untrusted input. A shared notebook must not be an attack.
    const bad = [
      { id: "a", kind: "view", label: "x", href: "javascript:alert(1)", note: "" },
      { id: "b", kind: "view", label: "x", href: "//evil.example.com/", note: "" },
      { id: "c", kind: "view", label: "x", href: "https://evil.example.com/", note: "" },
      { id: "d", kind: "view", label: "x", href: "relative/path", note: "" },
    ];
    expect(importSaved(notebook(bad))).toMatchObject({ added: 0, skipped: 4 });
    expect(getSavedItems()).toHaveLength(0);
  });

  it("skips malformed records instead of storing them", () => {
    const junk = [
      null,
      "a string",
      { id: "", kind: "root", label: "x", href: "/root/x/" },
      { id: "e", kind: "nonsense", label: "x", href: "/x/" },
      { id: "f", kind: "root", label: "x", href: "/x/", note: 42 },
      { id: "g", kind: "root", label: "x", href: "/x/", detail: {} },
      { id: "ok", kind: "root", label: "x", href: "/root/x/", note: "" },
    ];
    expect(importSaved(notebook(junk))).toMatchObject({ added: 1, skipped: 6 });
    expect(getSavedItems().map((i) => i.id)).toEqual(["ok"]);
  });

  it("caps an oversized file rather than filling the quota", () => {
    const many = Array.from({ length: 5010 }, (_, i) => ({
      id: `view:${i}`,
      kind: "view",
      label: `v${i}`,
      href: `/query/?q=${i}`,
      note: "",
    }));
    const result = importSaved(notebook(many));
    expect(result.added).toBe(5000);
    expect(result.skipped).toBe(10);
  });

  it("names the failure for a file that is not a notebook", () => {
    expect(() => importSaved("{ not json")).toThrow(/not-json/);
    expect(() => importSaved(JSON.stringify({ hello: "world" }))).toThrow(/not-a-notebook/);
  });

  it("defaults a missing savedAt rather than dropping the item", () => {
    expect(
      importSaved(
        notebook([{ id: "x", kind: "verse", label: "2:255", href: "/v/2:255/", note: "" }]),
      ),
    ).toMatchObject({ added: 1 });
    expect(getSavedItems()[0].savedAt).toBeTruthy();
  });
});
