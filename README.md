# Quranic Root & Word Research PWA

A free, open-source, account-less tool for researching Qur'anic Arabic roots and word forms: every derivative, every occurrence, with the Uthmani text and an English translation highlighted in context. Runs 100% client-side as a Next.js static export — no accounts, no login, no database server — and installs as a PWA that keeps working fully offline.

## Features

- **Search** by Arabic root (with or without diacritics), exact word, or English translation, with instant autocomplete.
- **Root pages** with a plain-language meaning, total occurrence count, a frequency breakdown by grammatical category and by lemma, and every distinct derived form with its count.
- **Contextual Ayah Explorer**: every occurrence of a root, filterable by category/lemma/surah, paginated, showing the full Uthmani verse with the matched word (and every other occurrence of the root in that verse) highlighted, plus its translation.
- **Word and Surah pages**, a full A–Z root browser, and an About page documenting data provenance and licenses.
- **Copy and export**: copy a verse (with or without translation) to the clipboard, or export the current filtered result set as CSV, JSON, Markdown, or plain text.
- **Offline-first PWA**: installable to a home screen, works offline for anything visited, with a one-click "download everything" option.
- **Light/dark theme**, obsidian/emerald palette, mobile-responsive throughout.

## Data

Built entirely from open datasets, downloaded and merged at build time (see [`/about`](./src/app/about) for the live provenance table and licenses):

| Source | What it provides | License |
|---|---|---|
| [mustafa0x/quran-morphology](https://github.com/mustafa0x/quran-morphology) | Root/lemma/grammar tagging for every word (fork of the Quranic Arabic Corpus) | GPL |
| [risan/quran-json](https://github.com/risan/quran-json) | Uthmani text, Saheeh International translation, surah metadata | CC-BY-SA 4.0 |
| [R3GENESI5/quran-bil-quran](https://github.com/R3GENESI5/quran-bil-quran) | Root meanings, after Lane's Lexicon | MIT |

An "occurrence" of a root is a morphological segment tagged with that root — particles, pronouns, and grammatical clitics never count toward one, matching how the underlying corpus itself counts roots.

## Getting started

```bash
pnpm install
pnpm dev
```

`pnpm dev`/`pnpm build` both run the data pipeline first (`pnpm data:build`), which downloads the sources above (cached under `data/raw/`, gitignored) and emits static JSON under `public/data/v1/` (also gitignored — regenerated on every build). Run `pnpm data:check` to validate the pipeline against known corpus invariants without writing files.

```bash
pnpm test      # Vitest unit tests
pnpm lint      # ESLint
pnpm build     # data pipeline + static export (out/) + service worker
```

## Deploying

This is a static site (`output: 'export'` in `next.config.ts`); deploy the `out/` directory anywhere that serves static files. On Vercel: import the repo, framework preset "Next.js", and it builds and deploys with no configuration.

## License

GPL-3.0 (see [LICENSE](./LICENSE)), matching the copyleft terms of the morphology dataset this project builds on. See [`/about`](./src/app/about) for full attribution of every data source.
