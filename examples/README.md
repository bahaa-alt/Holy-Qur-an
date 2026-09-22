# Examples

Runnable, reproducibility-oriented examples against this project's public
exports (`corpus.csv`, `codebook.json`, and the rest of `data/v1/`) -- for
a researcher who wants a working starting point rather than reverse-
engineering the schema from this app's own TypeScript source.

## `reproduce_keyness.py`

Loads `corpus.csv`, validates it against `codebook.json`'s documented
columns, and independently recomputes one of the app's own published
numbers end to end: the keyness of the root رحم ("mercy") in Surah 1
(Al-Fatihah) against the rest of the Qur'an -- the same G² test, log-ratio
effect size, and Wilson confidence interval the Compare tool (`/compare/`)
reports, reimplemented here from scratch in Python, not translated from
`src/lib/stats/keyness.ts`.

```sh
pip install pandas
python3 examples/reproduce_keyness.py
```

Requires a local `pnpm data:build` (or `pnpm build`) to have run first, so
`dist/export/corpus.csv` and `public/data/v1/codebook.json` exist. To run
against a deployed instance instead, with no local build:

```sh
python3 examples/reproduce_keyness.py \
  --base-url https://bahaa-alt.github.io/Holy-Qur-an \
  --corpus https://github.com/bahaa-alt/Holy-Qur-an/releases/download/corpus/corpus.csv
```

See the script's own docstring (`python3 examples/reproduce_keyness.py --help`)
for what each step checks and why that particular root/surah was chosen.
