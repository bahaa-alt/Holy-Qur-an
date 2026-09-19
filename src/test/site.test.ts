import { describe, expect, it } from "vitest";
import { SITE_ORIGIN, absoluteUrl } from "../lib/site";

describe("SITE_ORIGIN", () => {
  it("is an absolute https origin carrying the project base path", () => {
    expect(SITE_ORIGIN).toMatch(/^https:\/\//);
    expect(SITE_ORIGIN).toBe("https://bahaa-alt.github.io/Holy-Qur-an");
  });

  it("carries no trailing slash, so joins never double it", () => {
    expect(SITE_ORIGIN.endsWith("/")).toBe(false);
  });
});

describe("absoluteUrl", () => {
  it("keeps the base path when the argument starts with a slash", () => {
    // The whole reason this is not `new URL(path, base)`: the URL
    // constructor reads a leading slash as "from the host root" and would
    // give https://bahaa-alt.github.io/root/... -- a 404, on every page,
    // with nothing failing loudly.
    expect(absoluteUrl("/root/x/")).toBe("https://bahaa-alt.github.io/Holy-Qur-an/root/x/");
    expect(new URL("/root/x/", `${SITE_ORIGIN}/`).href).not.toBe(absoluteUrl("/root/x/"));
  });

  it("accepts a path with or without the leading slash", () => {
    expect(absoluteUrl("about/")).toBe(absoluteUrl("/about/"));
  });

  it("collapses a run of leading slashes rather than emitting a protocol-relative URL", () => {
    expect(absoluteUrl("//evil.example/")).toBe(
      "https://bahaa-alt.github.io/Holy-Qur-an/evil.example/",
    );
  });

  it("returns the site root for an empty path or a bare slash", () => {
    expect(absoluteUrl("/")).toBe("https://bahaa-alt.github.io/Holy-Qur-an/");
    expect(absoluteUrl("")).toBe("https://bahaa-alt.github.io/Holy-Qur-an/");
  });

  it("passes an already-encoded Arabic path through unchanged", () => {
    // Callers encode, as they do for every other href in the app; the
    // canonical URL has to be the address the server actually serves.
    const encoded = encodeURIComponent("رحم");
    expect(absoluteUrl(`/root/${encoded}/`)).toBe(
      `https://bahaa-alt.github.io/Holy-Qur-an/root/${encoded}/`,
    );
  });

  it("preserves the colon in a verse reference, which is a legal path character", () => {
    expect(absoluteUrl("/v/2:255/")).toBe("https://bahaa-alt.github.io/Holy-Qur-an/v/2:255/");
  });
});
