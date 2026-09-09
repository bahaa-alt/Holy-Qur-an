import { describe, expect, it } from "vitest";
import { stem, tokenizeEnglish, STOPWORDS } from "@/lib/search/stem";

describe("stem", () => {
  it("is idempotent: stemming an already-stemmed word returns it unchanged", () => {
    const words = [
      "knowledge",
      "believes",
      "believing",
      "running",
      "mercifully",
      "guidance",
      "worlds",
      "boxes",
      "flies",
      "universities",
      "the",
      "a",
    ];
    for (const w of words) {
      const once = stem(w);
      const twice = stem(once);
      expect(twice).toBe(once);
    }
  });

  it("folds inflected forms of the same word to a shared stem", () => {
    expect(stem("believes")).toBe(stem("believing"));
    expect(stem("believes")).toBe(stem("believed"));
    expect(stem("worlds")).toBe("world");
    expect(stem("boxes")).toBe("box");
    expect(stem("universities")).toBe("university");
  });

  it("leaves very short words alone", () => {
    expect(stem("in")).toBe("in");
    expect(stem("day")).toBe("day");
  });
});

describe("tokenizeEnglish", () => {
  it("lowercases, strips punctuation, and filters stopwords", () => {
    const tokens = tokenizeEnglish("In the name of Allah, the Entirely Merciful.");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("of");
    expect(tokens).toContain("allah");
  });

  it("never emits a stopword", () => {
    const tokens = tokenizeEnglish(
      "And We have certainly made the Qur'an easy for remembrance, so is there any who will remember?",
    );
    for (const t of tokens) {
      expect(STOPWORDS.has(t)).toBe(false);
    }
  });

  it("returns stemmed terms consistent with stem()", () => {
    const tokens = tokenizeEnglish("The believers believe in the unseen.");
    expect(tokens).toContain(stem("believe"));
  });
});
