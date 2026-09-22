#!/usr/bin/env python3
"""Regenerates src/app/fonts/amiri-quran-patched.woff2 from scratch.

THE BUG THIS FIXES: the Amiri Quran font next/font/google serves (Google
Fonts' "arabic" subset, and Fontsource's "full" copy -- both checked) is
missing a glyph for U+065E ARABIC FATHA WITH TWO DOTS, the tanwin mark on
words like شَرَابٞ. It is genuinely absent from the upstream font binary,
not a subsetting artifact -- 1,803 occurrences across this app's corpus (see
scripts/lib -- every 10th word or so uses it) render as a visible tofu box.

WHY ALIASING, NOT A NEW GLYPH: U+065E and U+064B ARABIC FATHATAN mark the
same grammatical thing (fatha-based nunation) and are visually near-
identical -- U+065E is simply the open/Quranic-orthography variant of a mark
Amiri Quran already draws and positions correctly. A genuinely new glyph
would need hand-authored GPOS mark-attachment data (which base-letter anchor
it snaps to) -- real font-engineering work, and a mistake there risks
misplacing OTHER, currently-correct marks. Aliasing the cmap entry onto an
*existing* glyph changes nothing else in the font: every GSUB/GPOS/GDEF
table stays byte-for-byte as Amiri Quran's own designer shipped it, so
nothing else can regress. If a future Amiri Quran release adds this glyph
properly, drop this patch and go back to next/font/google entirely.

Filed upstream: https://github.com/aliftype/amiri/issues (search for
U+065E / "fatha with two dots" before reporting again).

USAGE
    pip install fonttools[woff]
    pnpm build   # or: pnpm data:build && npx next build -- anything that
                 # makes next/font/google actually fetch and cache the font
    python3 scripts/patch-amiri-quran-font.py

Sources the untouched font straight out of `out/_next/static/media/` --
i.e. whatever next/font/google *actually* just downloaded and hashed for
`Amiri_Quran({ subsets: ["arabic"] })` in src/app/layout.tsx -- rather than
guessing a gstatic URL that Google can rotate at any time. Run a build
first if `out/` is stale or missing.
"""

import glob
import re

from fontTools.ttLib import TTFont

OUT_PATH = "src/app/fonts/amiri-quran-patched.woff2"

# Matches one @font-face block for the family/weight/style next/font/google
# emits for Amiri_Quran({ weight: "400" }), capturing its src url and
# unicode-range. There are two such blocks (Arabic subset, Latin subset);
# the Arabic one is picked out below by its unicode-range.
FONT_FACE_RE = re.compile(
    r"@font-face\{font-family:Amiri Quran;font-style:normal;font-weight:400;"
    r'font-display:swap;src:url\((?P<url>[^)]+)\)format\("woff2"\);'
    r"unicode-range:(?P<range>[^}]+)\}"
)


def find_source() -> str:
    """Every built CSS chunk is a candidate; all font src urls are relative
    to out/_next/static/chunks/, so `../media/<file>` always resolves to
    out/_next/static/media/<file> regardless of which chunk declared it."""
    for css_path in glob.glob("out/_next/static/chunks/*.css"):
        css = open(css_path, encoding="utf-8").read()
        for m in FONT_FACE_RE.finditer(css):
            if m["range"].startswith("U+6??"):  # the Arabic-block subset
                return "out/_next/static/media/" + m["url"].rsplit("/", 1)[-1]
    raise SystemExit(
        "Could not find the Arabic-subset Amiri Quran font in out/. Run `pnpm build` first."
    )


def main() -> None:
    source_path = find_source()
    print(f"Source: {source_path}")
    font = TTFont(source_path)
    target_glyph = font.getBestCmap().get(0x064B)
    if target_glyph is None:
        raise SystemExit("U+064B not found in the source font -- did the kit URL change?")
    if 0x065E in font.getBestCmap():
        print("Upstream now has U+065E natively -- this patch is no longer needed.")
        return

    for table in font["cmap"].tables:
        table.cmap.setdefault(0x065E, target_glyph)

    font.flavor = "woff2"
    font.save(OUT_PATH)
    print(f"Wrote {OUT_PATH}: U+065E now aliases {target_glyph} (U+064B's glyph).")


if __name__ == "__main__":
    main()
