import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const APP_DIR = join(process.cwd(), "src", "app");

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pageFiles(full));
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

/**
 * Every route has to declare its own canonical URL.
 *
 * This is a source scan rather than a behavioural test because the failure
 * it guards is silent and total. A page with no `alternates.canonical`
 * inherits the root layout's, which is the site root -- so the whole route
 * tells crawlers it is the home page and should be dropped. That is exactly
 * what happened to all 6,236 verse pages before this test existed: the
 * build was green, the HTML was valid, and every canonical was wrong.
 */
describe("canonical URLs", () => {
  const pages = pageFiles(APP_DIR);

  it("finds the app's pages at all, so a passing run means something", () => {
    expect(pages.length).toBeGreaterThan(15);
  });

  it.each(pages.map((p) => [relative(APP_DIR, p), p] as const))(
    "%s declares its own canonical",
    (_name, path) => {
      const src = readFileSync(path, "utf8");
      expect(src).toMatch(/alternates:\s*\{\s*canonical:/);
      // ...and builds it with the helper, not by hand: a hand-written
      // absolute URL would not carry the base path through a change of
      // origin, and a bare path would resolve against metadataBase, which
      // drops it. See src/lib/site.ts.
      expect(src).toContain("absoluteUrl(");
    },
  );

  it("routes that take params build the canonical from those params", () => {
    // A dynamic route with a constant canonical is the same bug wearing a
    // different hat: every page in the route would point at one URL.
    for (const path of pages.filter((p) => /\[[^\]]+\]/.test(p))) {
      const src = readFileSync(path, "utf8");
      const calls = [...src.matchAll(/absoluteUrl\(([^)]*)\)/g)].map((m) => m[1]);
      expect(calls.length, relative(APP_DIR, path)).toBeGreaterThan(0);
      expect(
        calls.some((c) => c.includes("${")),
        `${relative(APP_DIR, path)} builds a constant canonical for a dynamic route`,
      ).toBe(true);
    }
  });
});
