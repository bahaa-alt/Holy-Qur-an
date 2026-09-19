import type { LaneMetaFile, LaneRootFile } from "../../src/lib/data/types";
import { parseLaneEntry } from "./parse-lane-tei";
import type { LaneToken } from "./parse-lane-tei";

/** One `entry` row from the lexicon database, in source order. */
export interface RawLaneEntry {
  root: string;
  word: string;
  xml: string;
  page: number | null;
}

/**
 * Normalises a root for matching between this corpus and Lane's.
 *
 * The two use different orthographic conventions for hamza and for the weak
 * letters: this corpus writes أله, أمن, رمى, Lane writes اله, امن, رمي.
 */
export function normalizeRoot(root: string): string {
  return root
    .replace(/[أإآء]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

/**
 * Every spelling of `root` worth looking for in Lane, most faithful first.
 *
 * The only transformation beyond normalisation is GEMINATE CONTRACTION. This
 * corpus writes a doubled-final root in full — أبب, برر, أمم — where Lane
 * contracts it — اب, بر, ام. Applying that rule takes the match rate from
 * 87.8% to 97.9% of this corpus's 1,651 roots.
 *
 * Deliberately NOT attempted: substituting the final weak letter (و/ي/ا) to
 * find a near miss. It looks like it would help, and it is wrong — it maps
 * دهق onto دهو and نتق onto نتا, which are different roots, not spellings of
 * the same one. Attaching another root's lexicon entry to this one would be
 * a fabricated attribution, which is worse than showing nothing.
 */
export function laneCandidates(root: string): string[] {
  const n = normalizeRoot(root);
  const out = [n];
  // final two radicals identical: أبب -> اب
  if (n.length >= 3 && n[n.length - 1] === n[n.length - 2]) out.push(n.slice(0, -1));
  // reduplicated quadriliteral: زلزل -> زل
  if (n.length === 4 && n[0] === n[2] && n[1] === n[3]) out.push(n.slice(0, 2));
  return out;
}

/** Encodes a token as a single sigil-prefixed string (see LaneRootFile). */
export function encodeToken(tok: LaneToken): string {
  switch (tok.t) {
    case "s":
      return `s${tok.n}`;
    case "trop":
      return "^";
    case "pb":
      return `p${tok.v}`;
    default:
      return `${tok.t}${tok.v}`;
  }
}

/**
 * Builds one shard per corpus root that Lane covers, plus a coverage manifest.
 *
 * Sharded per root because that is exactly the access pattern: a root page
 * needs one root's article and nothing else. The whole lexicon restricted to
 * this corpus is ~21 MB; one shard averages ~13 KB.
 *
 * Coverage is partial and that is a property of the work, not of this code.
 * Lane died in 1876 having published through roughly ق/ك; the remainder was
 * assembled posthumously from his notes and is markedly thinner. It shows in
 * the data — ع has 3,800 entries, ي has 142 — and 26 of the 34 corpus roots
 * Lane does not cover fall in ك–ي.
 */
export function buildLane(
  entriesByLaneRoot: ReadonlyMap<string, readonly RawLaneEntry[]>,
  corpusRoots: readonly string[],
): { meta: LaneMetaFile; files: Map<string, LaneRootFile> } {
  // Index Lane's roots by their normalised spelling once, so each corpus root
  // is a handful of map lookups rather than a scan.
  const byNormalized = new Map<string, string>();
  for (const laneRoot of entriesByLaneRoot.keys()) {
    const key = normalizeRoot(laneRoot);
    if (!byNormalized.has(key)) byNormalized.set(key, laneRoot);
  }

  const files = new Map<string, LaneRootFile>();
  const uncovered: string[] = [];

  for (const root of corpusRoots) {
    const laneRoot = laneCandidates(root)
      .map((c) => byNormalized.get(c))
      .find((x): x is string => x !== undefined);

    if (laneRoot === undefined) {
      uncovered.push(root);
      continue;
    }

    const articles = (entriesByLaneRoot.get(laneRoot) ?? [])
      .map((e) => ({
        headword: e.word,
        page: e.page ?? null,
        tokens: parseLaneEntry(e.xml).map(encodeToken),
      }))
      .filter((a) => a.tokens.length > 0);

    if (articles.length === 0) {
      uncovered.push(root);
      continue;
    }

    files.set(root, { root, laneRoot, articles });
  }

  return {
    meta: {
      name: "An Arabic-English Lexicon",
      author: "Edward William Lane (1801-1876)",
      authorAr: "إدوارد وليم لين",
      coveredRoots: files.size,
      totalRoots: corpusRoots.length,
      uncoveredRoots: uncovered.sort(),
    },
    files,
  };
}
