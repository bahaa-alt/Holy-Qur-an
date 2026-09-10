# Reference tafsir texts

Raw tafsir (Qur'anic commentary) texts, kept here for future, gradual use in
research features -- **not** read by the shipped app today, and entirely
separate from `public/data` and `scripts/build-data.ts`.

## What's here

- `manifest.json` -- the 9 works originally requested, with reachability
  status, size, author, and provenance notes for each.
- `ar-tafsir-al-jalalayn/` -- **committed**: the full text of Tafsir
  al-Jalalayn (~6 MB, one JSON file per surah, `{surah}.json`), the only one
  of the four reachable Arabic works small enough to commit outright.

The other three reachable works (al-Kashshaf, Ruh al-Ma'ani, Mafatih
al-Ghayb) are **not** committed -- see "Fetching the rest" below. Three more
requested works (Haqa'iq al-Tafsir by al-Sulami, 'Ara'is al-Bayan by
al-Baqli, and al-Bahr al-Madid by Ibn 'Ajiba) could not be found at any
source reachable from this project's environment at all; see
`manifest.json`'s `unavailable` entries for what was checked.

## File shape

Each `{surah}.json` is an array of one entry per verse:

```json
[{ "surah": 1, "ayah": 1, "text": "..." }, ...]
```

## Fetching the rest

```bash
pnpm tsx scripts/fetch-tafsir.ts --list                        # see all candidates + sizes
pnpm tsx scripts/fetch-tafsir.ts al-kashshaf-al-zamakhshari     # ~56 MB
pnpm tsx scripts/fetch-tafsir.ts tafsir-al-alusi                # ~100 MB
pnpm tsx scripts/fetch-tafsir.ts tafsir-al-razi                 # ~200 MB
pnpm tsx scripts/fetch-tafsir.ts --all-available                # all four
```

Downloads are resumable (an already-present surah file is skipped) and land
under `references/tafsir/<slug>/`, which stays git-ignored except for the
already-committed `ar-tafsir-al-jalalayn/` -- see `.gitignore` in this
directory. Fetch whichever ones you actually need, whenever you need them.

## Provenance & licensing

All four available works were fetched via
[spa5k/tafsir_api](https://github.com/spa5k/tafsir_api) (MIT-licensed
packaging; mirrors [qul.tarteel.ai](https://qul.tarteel.ai)'s tafsir
resources), served over `raw.githubusercontent.com`. The tafsir texts
themselves are classical Islamic scholarship, not original works of that
repository's maintainer. See `manifest.json` for exactly which sources were
checked and which were unreachable (several candidate sources -- archive.org,
altafsir.com, api.quran.com, tanzil.net, qul.tarteel.ai directly,
api.alquran.cloud -- are blocked by this project's sandbox network policy;
only GitHub's raw-content CDN was reachable).
