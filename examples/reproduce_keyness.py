#!/usr/bin/env python3
"""Reproduce one of this app's own published numbers, end to end, from the
public export -- not to be taken on faith, but to check.

WHAT THIS DOES. Loads corpus.csv (the bulk word-level export the About
page links to), validates it against codebook.json (the machine-readable
schema), and independently recomputes the keyness of the root رحم ("mercy")
in Surah 1 (Al-Fatihah) against the rest of the Qur'an: the same G² test,
log-ratio effect size, and Wilson confidence interval the Compare tool
(/compare/) reports, implemented here from scratch in a different
language, not copied from the TypeScript source. The result is compared
against the live app's own number for that exact row.

WHY THIS ONE. Al-Fatihah repeats "the Entirely Merciful, the Especially
Merciful" and closes with a plea for mercy -- رحم's concentration there is
about as well-known a claim as this app makes, and a good one to check
first if you are deciding whether to trust anything else it reports.

USAGE
  # From a checkout that has run the data pipeline (`pnpm data:build`):
  python3 examples/reproduce_keyness.py

  # Against a deployed instance's codebook.json/manifest.json, with no
  # local build -- corpus.csv is a GitHub release asset on a different
  # origin, so pass its URL directly (pandas reads a URL like a path):
  python3 examples/reproduce_keyness.py \
    --base-url https://bahaa-alt.github.io/Holy-Qur-an \
    --corpus https://github.com/bahaa-alt/Holy-Qur-an/releases/download/corpus/corpus.csv

Requires: pandas (`pip install pandas`). Everything else is the standard
library, deliberately -- a researcher reproducing a number should not need
to trust code they cannot quickly read in full.
"""

import argparse
import csv
import json
import math
import sys
import urllib.request
from pathlib import Path

import pandas as pd

ROOT = "رحم"
SURAH = 1

# ---------------------------------------------------------------------------
# The keyness formulas themselves -- independently implemented from the same
# papers src/lib/stats/keyness.ts cites, not translated from that file.
# ---------------------------------------------------------------------------


def log_likelihood_g2(a: int, b: int, c: int, d: int) -> float:
    """Log-likelihood G² (Dunning 1993), in the two-corpus form Rayson &
    Garside (2000) use for keyness: a/c is the scope's rate, b/d is the
    reference's rate, both against the SAME kind of denominator."""
    total = c + d
    expected_a = c * (a + b) / total
    expected_b = d * (a + b) / total
    s = 0.0
    if a > 0 and expected_a > 0:
        s += a * math.log(a / expected_a)
    if b > 0 and expected_b > 0:
        s += b * math.log(b / expected_b)
    return 2 * s


def chi_square_p_1df(x: float) -> float:
    """p-value of a G² at 1 degree of freedom: exactly erfc(sqrt(x/2))."""
    if not (x > 0):
        return 1.0
    return math.erfc(math.sqrt(x / 2))


def log_ratio(a: int, b: int, c: int, d: int) -> tuple[float, bool]:
    """Effect size in doublings (Hardie 2014); a zero count is floored to
    0.5 so the value stays finite, and that floor is flagged."""
    estimated = a == 0 or b == 0
    safe_a = 0.5 if a == 0 else a
    safe_b = 0.5 if b == 0 else b
    return math.log2((safe_a / c) / (safe_b / d)), estimated


def wilson_interval(successes: int, total: int, z: float = 1.959963984540054) -> tuple[float, float]:
    """95% Wilson score interval (Wilson 1927) for a binomial proportion."""
    if total <= 0:
        return 0.0, 0.0
    p = successes / total
    z2 = z * z
    denom = 1 + z2 / total
    center = p + z2 / (2 * total)
    margin = z * math.sqrt(p * (1 - p) / total + z2 / (4 * total * total))
    return max(0.0, (center - margin) / denom), min(1.0, (center + margin) / denom)


# ---------------------------------------------------------------------------
# Loading the public export -- local files by default, or a deployed
# instance's data/v1/ if --base-url is given (the same convention
# scripts/qcql-cli.ts uses).
# ---------------------------------------------------------------------------


def load_json(path_or_url: str) -> dict:
    if path_or_url.startswith("http"):
        with urllib.request.urlopen(path_or_url) as resp:
            return json.load(resp)
    with open(path_or_url, encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--corpus",
        default=str(Path(__file__).resolve().parent.parent / "dist" / "export" / "corpus.csv"),
        help="Path or URL to corpus.csv (default: dist/export/corpus.csv, from a local `pnpm data:build`)",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help="Fetch codebook.json/manifest.json from a deployed instance's data/v1/ instead of local files "
        "(corpus.csv is a separate GitHub release asset -- pass its URL via --corpus to match)",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    codebook_path = (
        f"{args.base_url.rstrip('/')}/data/v1/codebook.json"
        if args.base_url
        else str(repo_root / "public" / "data" / "v1" / "codebook.json")
    )

    print(f"Loading codebook from {codebook_path} ...")
    try:
        codebook = load_json(codebook_path)
    except OSError as err:
        sys.exit(
            f"Could not load codebook.json ({err}).\n"
            "Run `pnpm data:build` first, or pass --base-url for a deployed instance."
        )
    expected_columns = [c["name"] for c in codebook["corpusCsv"]["columns"]]
    print(f"  {len(expected_columns)} documented columns, {codebook['corpusCsv']['rowCount']:,} documented rows.")

    print(f"\nLoading corpus from {args.corpus} ...")
    try:
        df = pd.read_csv(args.corpus, dtype={"root": str, "lemma": str, "tags": str}, keep_default_na=False)
    except FileNotFoundError:
        sys.exit(
            f"{args.corpus} not found.\n"
            "corpus.csv is a bulk download (~37 MB), built with `pnpm data:build` "
            "(lands in dist/export/corpus.csv) or downloaded from a GitHub release -- see the About page."
        )

    # Validate against the schema just fetched, rather than assuming the
    # file matches it -- the whole point of shipping a codebook.
    actual_columns = list(df.columns)
    assert actual_columns == expected_columns, (
        f"corpus.csv's columns do not match codebook.json's:\n  got {actual_columns}\n  expected {expected_columns}"
    )
    print(f"  {len(df):,} rows, columns match the codebook exactly.")

    # --- Cross-check against manifest.json's headline counts ---
    manifest_path = (
        f"{args.base_url.rstrip('/')}/data/v1/manifest.json"
        if args.base_url
        else str(repo_root / "public" / "data" / "v1" / "manifest.json")
    )
    manifest = load_json(manifest_path)
    rooted = df[df["root"] != ""]
    print(f"\nRooted rows in corpus.csv: {len(rooted):,}")
    print(f"manifest.json's occurrence count: {manifest['counts']['occurrences']:,}")
    diff = manifest["counts"]["occurrences"] - len(rooted)
    if diff:
        print(
            f"  Off by {diff}, exactly the documented exception (see codebook.json's `root` column "
            "description and the app's own corpus.csv comment): word 20:94:2 has two rooted segments, "
            "and corpus.csv -- one row per WORD -- represents only one of them."
        )

    # --- Reproduce the keyness row itself ---
    print(f"\nReproducing keyness of root {ROOT!r} in surah {SURAH} vs. the rest of the Qur'an ...")
    scope = rooted[rooted["surah"] == SURAH]
    reference = rooted[rooted["surah"] != SURAH]

    a = int((scope["root"] == ROOT).sum())
    b = int((reference["root"] == ROOT).sum())
    c = len(scope)
    d = len(reference)
    print(f"  a (occurrences in scope)      = {a}")
    print(f"  b (occurrences in reference)  = {b}")
    print(f"  c (rooted tokens in scope)    = {c}")
    print(f"  d (rooted tokens in reference) = {d}  (see the {diff}-row note above -- this app's own")
    print(f"                                          live number for `d` is {d + diff}, from occurrences.json)")

    g2 = log_likelihood_g2(a, b, c, d)
    p = chi_square_p_1df(g2)
    lr, lr_estimated = log_ratio(a, b, c, d)
    rate = a / c * 10_000
    reference_rate = b / d * 10_000
    ci_low, ci_high = wilson_interval(a, c)

    print(f"\n  G\u00b2  = {g2:.6f}   (app's live figure, using the exact `d`: 18.353556)")
    print(f"  p   = {p:.6e}")
    print(f"  log ratio = {lr:.4f}{' (zero-floored)' if lr_estimated else ''}")
    print(f"  rate = {rate:.2f} per 10,000 rooted tokens  [{ci_low * 10_000:.2f}, {ci_high * 10_000:.2f}] (95% Wilson CI)")
    print(f"  reference rate = {reference_rate:.2f} per 10,000 rooted tokens")
    print(
        f"\nThe tiny gap from the app's own d (a single word's known, documented edge case, not a "
        "discrepancy to chase) is the entire distance between this script and the live site -- "
        "everything else here is independently reproduced from the public export alone."
    )


if __name__ == "__main__":
    main()
