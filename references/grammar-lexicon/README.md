# Reference grammar & lexicon texts

Classical Arabic grammar and lexicon works requested for future use, kept
here the same way `references/tafsir/` holds tafsir texts -- **not** read by
the shipped app today.

Unlike the tafsir search, none of the 9 works requested here (a mix of
foundational grammar books and major dictionaries) turned up in a cleanly
structured, directly downloadable form at any source reachable from this
project's environment. See `manifest.json` for exactly what was checked:
two promising leads were identified but not resolved to exact download
paths --

- **Al-Kitab (Sibawayh)** likely exists in the [OpenITI](https://github.com/OpenITI)
  corpus (a large multi-repo collection of classical texts), which has a
  known identifier for it, but OpenITI splits texts across dozens of
  repositories by a 25-lunar-year period scheme and this session couldn't
  locate a metadata index mapping identifiers to exact file paths.
- **Lisan al-Arab** and **al-Qamus al-Muhit** are both bundled in a
  compressed SQLite database in the
  [wizsk/arabic_lexicons](https://github.com/wizsk/arabic_lexicons) repo,
  but that database ships only as a GitHub Release asset (an app build
  artifact) rather than a plain file in the repo tree, and its
  license/redistribution terms for the dictionary text weren't confirmed.

Both are reasonable starting points for a future session with more time (or
network access to kitab-project.org / shamela.ws, both blocked from this
environment) to resolve properly, rather than leads to keep re-discovering
from scratch.
