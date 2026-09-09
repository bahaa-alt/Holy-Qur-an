# Quranic Root & Word Research PWA — Implementation Plan

## Context

Build a free, open-source, account-less Quranic root/word research tool that runs 100% client-side as a Next.js static export deployed on Vercel, installable as a PWA and fully usable offline. The repo (`bahaa-alt/Holy-Qur-an`, branch `claude/quranic-root-research-pwa-vhg2w3`) is currently **empty** — this is greenfield.

The hard part is not the UI, it is the **data**: every word of the Qur'an must be tagged with its root, lemma and grammatical form, and the app must ship that as static JSON small enough for a phone. Everything below is designed around three verified open datasets, pulled at build time by a script (never committed raw), transformed into sharded JSON under `public/data/`.

### Verified data sources (checked 2026-09-09)

| # | Dataset | URL | License | What we take |
|---|---|---|---|---|
| 1 | **Quran morphology** (Arabic-script fork of Quranic Arabic Corpus v0.4) | `https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt` (6 MB TSV) | GPL (upstream corpus) | root, lemma, POS + feature tags for every segment. 130,030 segments, 77,429 words, 6,236 verses, **1,651 roots, 4,776 lemmas**. Concatenating a word's segments reproduces the Uthmani word exactly; joining words reproduces the verse (verified on 1:1, 2:255). |
| 2 | **Uthmani text + Saheeh International translation + surah metadata** | npm `quran-json@3.1.2` → `https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters/en/{1..114}.json` | CC-BY-SA 4.0 (risan/quran-json) | `{id,name,transliteration,translation,type,total_verses,verses:[{id,text,translation,transliteration}]}` |
| 3 | **Root meanings** (after Lane's Lexicon, public domain) | `https://raw.githubusercontent.com/R3GENESI5/quran-bil-quran/master/app/data/roots_index.json` (740 KB) | MIT | object keyed by Arabic root → `{b: buckwalter, m: English meaning paragraph, f: freq, v: [...]}`; covers all 1,651 roots |

TSV row format of #1 (tab-separated: `surah:ayah:word:segment`, segment form, POS letter N/V/P, pipe features):
```
2:2:2:2	كِتَٰبُ	N	ROOT:كتب|LEM:كِتاب|M|NOM
2:79:3:1	يَكْتُبُ	V	IMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:IND
1:1:3:2	رَّحْمَٰنِ	N	ROOT:رحم|LEM:رَحْمٰن|MS|GEN|ADJ
```
Note: #2's text uses U+06E1 (small high dotless head of khah) for sukun where #1 uses U+0652 — never compare strings between them, only token positions after a whitespace split. Attribution for all three must appear on an `/about` page; GPL data + CC-BY-SA text means the repo itself should be licensed **GPL-3.0** (or AGPL) to be safe — note this in `LICENSE` and `README`.

`tanzil.net`, `qul.tarteel.ai`, `api.alquran.cloud` were **not reachable** from the sandbox; do not depend on them.

### Decisions taken (change here if you disagree)
- **UI language**: English UI, Arabic content; grammar terms shown EN with AR in tooltips (from `morphology-terms-ar.json`). A full AR/EN UI toggle is a v2 item.
- **Translation**: Saheeh International only in v1 (it ships inside `quran-json`); the data shape leaves room for more (`t` → per-translation files later).
- **"Occurrence"** = a morphological segment tagged with a root. Particles, pronouns and clitics never count toward a root. Counts will therefore match the Quranic Arabic Corpus, not Zekr/other tools that count whole tokens.
- **Root meaning** text is displayed as "Meaning (after Lane's Lexicon)" and comes from the MIT `roots_index.json`; users can open the full paragraph. No hand-written glosses.
- **License**: GPL-3.0 for the repo, because the morphology data is GPL.

---

## Stack (pinned)

- **Next.js 15** (app router, TypeScript strict) with `output: 'export'`, `images.unoptimized: true`, `trailingSlash: true` (so `/root/كتب/` → `root/كتب/index.html` on Vercel static hosting).
- **Tailwind CSS v4** (`@tailwindcss/postcss`), dark mode via `@custom-variant dark (&:where(.dark, .dark *))`, class toggled on `<html>` and persisted in `localStorage` with an inline no-flash script in `layout.tsx`.
- **lucide-react** icons. **No UI kit.**
- **Fonts**: `next/font/google` — `Amiri Quran` (or `Scheherazade New`) for Uthmani text, `Noto Naskh Arabic` for Arabic UI, `Inter` for Latin. Fonts self-host at build time via next/font so they work offline.
- **Search**: no library. Prebuilt indices + `Map` lookups; English keyword search over a prebuilt inverted index. (Optionally `minisearch` later — not in v1.)
- **PWA**: hand-written `public/manifest.webmanifest` + service worker **generated post-build** by `scripts/build-sw.ts` (zero runtime deps; `next-pwa`/`serwist` fight with static export + Turbopack).
- **Data build**: `tsx scripts/build-data.ts` in `prebuild`, downloads with a cache in `data/raw/` (git-ignored), writes `public/data/**` (git-ignored except `public/data/.gitkeep`; Vercel runs prebuild). Deterministic output; a `--check` flag validates without writing.
- Tooling: `pnpm`, ESLint (next config), Prettier, Vitest for the pure functions (`normalize`, `classify`, `parseMorphology`, `highlight`).

---

## File tree

```
.
├── README.md                     # what/why, screenshots, data provenance, deploy button
├── LICENSE                       # GPL-3.0
├── package.json                  # scripts: prebuild, dev, build, postbuild, test, lint, data:check
├── next.config.ts                # output:'export', trailingSlash, images.unoptimized
├── tsconfig.json
├── postcss.config.mjs            # @tailwindcss/postcss
├── vitest.config.ts
├── .gitignore                    # .next out node_modules data/raw public/data/* !public/data/.gitkeep
├── .github/workflows/ci.yml      # pnpm i, data:check, lint, test, build
│
├── scripts/
│   ├── build-data.ts             # orchestrator: download → parse → validate → emit
│   ├── build-sw.ts               # postbuild: scans out/, writes out/sw.js with precache manifest
│   └── lib/
│       ├── download.ts           # fetch with data/raw cache + sha256 log
│       ├── parse-morphology.ts   # TSV → Segment[] → Word[] (join segments)
│       ├── classify.ts           # feature tags → FormCategory (shared with app via src/lib)
│       ├── normalize.ts          # (re-export of src/lib/arabic/normalize.ts)
│       ├── build-roots.ts        # per-root shard + search index rows
│       ├── build-surahs.ts       # per-surah text/translation + token-count validation
│       ├── build-en-index.ts     # English inverted index (stemmed-lite)
│       └── emit.ts               # stable JSON writer (sorted keys, no whitespace), size report
│
├── data/raw/                     # git-ignored download cache
│
├── public/
│   ├── manifest.webmanifest
│   ├── icons/ icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png favicon.svg
│   ├── offline.html              # SW fallback page
│   └── data/v1/                  # BUILD OUTPUT, git-ignored (see "Data layer")
│       ├── manifest.json  meta.json  index.json  forms.json  en-index.json
│       ├── roots/{root}.json     # 1,651 files
│       ├── lemmas/{key}.json     # 148 rootless lemmas
│       └── surahs/{1..114}.json
│
└── src/
    ├── app/
    │   ├── layout.tsx            # fonts, theme no-flash script, <ServiceWorkerRegister/>, Header, Footer
    │   ├── globals.css           # tailwind import, theme tokens (obsidian/emerald), Uthmani text utilities
    │   ├── page.tsx              # Home: hero search, "explore roots" cloud, recent searches
    │   ├── about/page.tsx        # provenance, licenses, how counts are computed, offline notes
    │   ├── roots/page.tsx        # A–Z (ا–ي) browse of all roots with counts
    │   ├── root/[root]/page.tsx  # generateStaticParams over 1,651 roots; renders <RootView/>
    │   ├── word/[lemma]/page.tsx # generateStaticParams over 4,776 lemmas; renders <WordView/>
    │   ├── surah/[n]/page.tsx    # 114 pages; verse list, ?ayah= focus, per-word root chips
    │   ├── not-found.tsx
    │   ├── manifest.ts?          # NO — keep static file in public/ (simpler with export)
    │   └── icon.svg
    │
    ├── components/
    │   ├── layout/ Header.tsx  Footer.tsx  ThemeToggle.tsx  InstallPrompt.tsx  OfflineBadge.tsx
    │   ├── search/ SearchBox.tsx  SuggestionList.tsx  SuggestionItem.tsx  useSearch.ts
    │   ├── root/   RootView.tsx  RootHeader.tsx  FrequencyChart.tsx  FormsTable.tsx
    │   │           CategoryTabs.tsx  DerivativeCard.tsx
    │   ├── ayah/   AyahExplorer.tsx  AyahCard.tsx  HighlightedVerse.tsx  AyahActions.tsx
    │   │           Pagination.tsx  FilterBar.tsx (surah / form / category filters)
    │   ├── word/   WordView.tsx
    │   ├── export/ ExportMenu.tsx (JSON / CSV / Markdown / plain text; copy or download)
    │   └── ui/     Button.tsx  Badge.tsx  Card.tsx  Tabs.tsx  Kbd.tsx  Skeleton.tsx  Toast.tsx
    │
    ├── lib/
    │   ├── arabic/ normalize.ts  buckwalter.ts (optional)  letters.ts (ا–ي order)
    │   ├── data/   types.ts  loader.ts (fetch + in-memory Map cache + prefetch-all)
    │   │           useRoot.ts  useSurah.ts  useSearchIndex.ts  useEnIndex.ts
    │   ├── morphology/ classify.ts  tagLabels.ts (EN/AR labels for tags, from morphology-terms-ar.json)
    │   ├── search/ suggest.ts (ranking), english.ts, arabic.ts
    │   ├── export/ formatters.ts (toCSV, toMarkdown, toJSON, toPlainText)
    │   ├── highlight.ts          # token-index based highlighter
    │   ├── surahNames.ts         # from meta.json at build; fallback static list
    │   └── pwa/ registerSW.ts   # + beforeinstallprompt capture
    │
    └── test/  normalize.test.ts  classify.test.ts  parse-morphology.test.ts  highlight.test.ts  export.test.ts
```

---

## Data layer

### Exact corpus facts (use as build assertions in `pnpm data:check`)

| Invariant | Value |
|---|---|
| segments / words / verses / surahs | 130,030 / 77,429 / 6,236 / 114 |
| distinct roots | 1,651 (1,608 triliteral + 43 quadriliteral; roots are written with **أ** not ء, e.g. `أله`, `أمن`) |
| distinct lemmas | 4,776 = 4,629 rooted + 148 rootless (و, ال, ل, مِن, ف, ما, ب, لا, فِي, إِنّ, الَّذِي, عَلَى …) |
| segments carrying `ROOT:` (= "occurrences") | 50,269 |
| distinct (root, stem-segment form) pairs | 11,689 |
| distinct full words (all segments joined) carrying a root | 17,864 |
| words with two rooted segments | exactly 1 — `20:94:2` يَبْنَؤُمَّ (بني + أمم) → emit under both roots |
| largest roots (segments) | أله 2,851 · قول 1,722 · كون 1,390 · ربب 980 · أمن 879 · علم 854 |
| spot checks | كتب 319 · رحم 339 · longest verse 2:282 = 128 words |
| tags | POS ∈ {N,V,P}; verb aspect PERF/IMPF/IMPV; `VF:1..11`; `MOOD:IND/JUS/SUBJ`; derivational: ACT_PCPL, PASS_PCPL, VN, ADJ, PN; person/gender/number like 3MP, FS, 1P; case NOM/ACC/GEN; clitics PREF/SUFF/DET/CONJ/PRON |

### Pipeline `scripts/build-data.ts` → `public/data/v1/`
1. **Download** (cached in `data/raw/`, `--force` refetch, sha256 logged): morphology TSV, 114 quran-json chapter files, `roots_index.json`.
2. **Parse** TSV → `Segment {s,a,w,seg,form,pos,feats:string[]}`; group → `Word {s,a,w,text (segments joined), segments[]}` → verses.
3. **Validate per verse**: `morphWords.length === quranJson.text.trim().split(/\s+/).length`. Match → display tokens come from quran-json (canonical). Mismatch → use morphology-reconstructed tokens, set `m:1`, record in `manifest.mismatches`. Warn (don't fail) if `normalize(join(morph)) !== normalize(quranJsonText)`.
4. **Derive** roots → lemmas → forms → categories; attach gloss from `roots_index.json[root].m` (full) and `glossShort` = first sentence, ≤ 140 chars. Warn on any root in the morphology lacking a gloss and vice-versa.
5. **Emit** with stable key order, no whitespace, print a size table (raw + gzip) and fail if budgets are exceeded.

### Output files & TypeScript shapes (`src/lib/data/types.ts`, imported by both scripts and app)

| File | Shape | Load | Est. gz |
|---|---|---|---|
| `manifest.json` | `{version, builtAt, hash, counts, sources:[{name,url,license}], mismatches:[s,a,morphN,jsonN][]}` | eager | 1 KB |
| `meta.json` | `{surahs:[{n,nameAr,nameEn,translit,type:'meccan'\|'medinan',ayahs}]}` | eager | 5 KB |
| `index.json` | `{roots:[ar,key,bw,count,lemmaCount,verseCount,glossShort][]; lemmas:[lemma,key,rootIdx(-1 if none),count,cat][]}` | eager (autocomplete) | ~90 KB |
| `forms.json` | `[key, altKey\|null, rootIdx, lemmaIdx, count][]` over the **17,864 full words + 11,689 stem forms** (deduped by key), sorted by key for binary-search prefix lookup | idle prefetch | ~150 KB |
| `en-index.json` | `{terms:string[] (sorted stems), postings:number[][] (delta-encoded global verse ids 0..6235)}` | idle prefetch | ~150 KB |
| `surahs/{1..114}.json` | `{n, verses:[{a, w:string[] (tokens), t:string (Saheeh), m?:1}]}` | on demand + background full prefetch | ~700 KB total |
| `roots/{root}.json` ×1,651 (filename = Arabic root, URL-encoded) | `RootFile` below | on demand | ~350 KB total; قول ≈ 12 KB |
| `lemmas/{key}.json` ×148 (rootless lemmas only) | `RootFile` with `root:null` | on demand | ~150 KB total |

```ts
type Cat = 'verb.perf'|'verb.impf'|'verb.impv'|'noun'|'actPcpl'|'passPcpl'|'verbalNoun'|'adj'|'properNoun'|'other';
interface RootFile {
  root: string|null; bw?: string; gloss?: {en: string; short: string}; total: number;
  lemmas: { lemma: string; key: string; pos: 'N'|'V'; count: number;
            cats: Partial<Record<Cat, number>>; vf?: Record<string, number> }[];
  forms:  { form: string /* stem segment, e.g. كِتَٰبُ */; key: string; lemmaIdx: number; cat: Cat; count: number }[];
  feats:  string[];   // deduped feature strings e.g. "V|IMPF|VF:1|3MP|MOOD:IND" for the tag chips
  occ:    [s: number, a: number, w: number, seg: number, formIdx: number, featIdx: number][]; // Quran order
}
```
Whole-corpus offline footprint ≈ 1.6 MB gz; critical path on first visit ≈ `index.json` + one root file + the surah files for the first page (< 150 KB).

### Normalization (`src/lib/arabic/normalize.ts`, one implementation for build + runtime, unit-tested)
- Strip: U+0610–U+061A, U+064B–U+065F, U+0670 (dagger alif), U+06D6–U+06ED, U+0640 (tatweel).
- Map: ٱ أ إ آ → ا; ى → ي; ة → ه. Leave ء ؤ ئ untouched in words.
- **Root keys** additionally map ء → ا (so typed `امن`/`أمن` both resolve to root `أمن`); build asserts no two roots share a key.
- Forms containing U+0670 also get `altKey` with U+0670→ا (`رحمن` and `رحمان` both match).
- Ranking: if the query contains tashkeel, exact diacritized match first; then count desc; roots before lemmas before forms.

### Form-category mapping (`src/lib/morphology/classify.ts`, applied to the rooted segment's tags)
1. POS `V`: `PERF`→verb.perf, `IMPF`→verb.impf, `IMPV`→verb.impv; keep `VF:n` for a Form I–X sub-breakdown and `MOOD`.
2. Else: `PN`→properNoun, `ACT_PCPL`→actPcpl, `PASS_PCPL`→passPcpl, `VN`→verbalNoun, `ADJ`→adj, else→noun.
3. Anything unmatched → other; build prints unmatched combos.
- Rootless words (particles, pronouns) are searchable as exact forms (`forms.json` rootIdx −1) and get a word page from `lemmas/{key}.json`; they never count toward a root.
- Human-readable tag labels EN + AR from `morphology-terms-ar.json` (same repo) → `src/lib/morphology/tagLabels.ts` (committed, small).

### English search
Build: tokenize Saheeh text (lowercase, strip punctuation, ~60 stopwords, light suffix stemmer in `src/lib/search/stem.ts` shared with runtime). Runtime: prefix-expand the last query term over sorted `terms` (binary search), intersect postings, rank by tf, take top 8 verse ids, fetch their surah files (cached) for snippets. Also match `glossShort` of roots containing the term (top 3). No search library.

### Highlighting (`src/lib/highlight.ts`)
Token-index only: `occ.w` (1-based) → `verses[a].w[w-1]`. Alignment always holds because fallback verses use morphology tokens. Whole word is highlighted (clitics like وَ included); the stem segment can be emphasised further via `seg` + segment lengths in v2.

### Client loading (`src/lib/data/loader.ts`)
Singleton `Map<string, Promise<unknown>>` keyed by URL; `getIndex()`, `getForms()`, `getEnIndex()`, `getRoot(root)`, `getLemma(key)`, `getSurah(n)`, `getVerses(refs)` (dedupes surah fetches). Thin hooks (`useRoot`, `useSurah`, `useSearchIndex`) with loading/error state; no IndexedDB, no global store — persistence is the SW cache. `prefetchAll(onProgress)` warms all surah + root files in batches of 20 for offline.

### Routing under static export
- `/root/[root]/` — `generateStaticParams` from `index.json`; the server component reads the root JSON from disk at build time and statically renders header, gloss, category chart, lemma + forms tables (instant meaningful paint, SEO). The occurrence explorer is a client component fetching `/data/v1/roots/{root}.json` + only the surah files for the visible page.
- `/word/[slug]/` — slug = lemma `key` (collisions get `~2` suffix from a build-emitted map); rooted lemmas reuse the root file filtered by `lemmaIdx`; rootless use `lemmas/{key}.json`.
- `/surah/[n]/` — 114 pages; `?ayah=` focus (wrapped in Suspense for `useSearchParams`).
- No per-verse route (6,236 shells add build time for little value); verse deep links are `/surah/2/?ayah=255`.

### Risks / edge cases
- Token-count mismatches (pause marks, sajdah signs, muqattaʿāt) → fallback path above; review `manifest.mismatches` after first build.
- Same lemma spelled with differing diacritics within one root would split counts → build warns on lemmas equal under normalization within a root.
- Huge roots (أله, قول, كون): never render all occurrences at once; paginate 25–50 and lazy-load surahs; full export triggers a bulk surah fetch with progress.
- RTL: `dir="rtl" lang="ar"` on Arabic containers, `<bdi>` around `2:255` refs; bundle a Uthmani font (system fonts misplace Quranic marks).
- GPL data + CC-BY-SA text → repo license GPL-3.0, attribution on `/about`, provenance in `manifest.json`.

---

## UI / UX specification

### Visual language
- Palette tokens in `globals.css`: light bg `#f8faf9`, surface `#ffffff`, ink `#0b0f0e` (obsidian); dark bg `#0b0f0e`, surface `#121816`, ink `#e6ebe9`. Accent **emerald** `#059669` / dark `#34d399`; highlight for target word: emerald underline + soft emerald background, never yellow.
- Typography: Uthmani verse text 1.75–2.25rem, `line-height: 2.2`, `dir="rtl"`, `lang="ar"`, font-feature `"calt"`; translation in Inter 0.95rem muted.
- Minimalist: thin 1px borders, 12px radius, no shadows except the search popover. Generous whitespace; max content width 48rem for reading, 72rem for tables.

### Pages
1. **Home `/`** — centered `SearchBox` (autofocus, `/` hotkey), placeholder cycles "كتب · رحم · knowledge · يعلمون". Below: "Most frequent roots" chips (top 30 from search index), "Browse all roots ا–ي", "Random root". Footer: offline status, data version, license links.
2. **Root `/root/[root]/`** —
   - `RootHeader`: root letters spaced (ك ت ب), Buckwalter, total occurrences, #lemmas, #distinct forms, #verses, #surahs. Gloss paragraph "Meaning (after Lane's Lexicon)" with expand/collapse.
   - `FrequencyChart`: horizontal bar chart (pure CSS/SVG, no chart lib) — by **category** (verb-perfect, verb-imperfect, imperative, verbal noun, active participle, passive participle, noun, adjective, proper noun, other) and toggle to by **lemma**.
   - `FormsTable`: every distinct surface form → lemma, category, tags (e.g. "Form IV · 3MP · imperfect"), count; sortable; click → filters explorer.
   - `AyahExplorer`: filter bar (category, lemma, form, surah), sort (Quran order / frequency), 25 per page; each `AyahCard` shows surah name (AR+EN) + `2:255`, full Uthmani verse with target word(s) highlighted (all occurrences of the root in that verse highlighted; the clicked form emphasized), translation, per-card actions: copy Arabic, copy Arabic+translation, open in surah, link.
   - Sticky `ExportMenu`: export current filtered result set as CSV/JSON/Markdown/TXT (copy to clipboard or download via Blob).
3. **Word `/word/[lemma]/`** — lemma header, root link, category, list of surface forms with counts, same explorer scoped to the lemma.
4. **Surah `/surah/[n]/`** — all verses; each verse's words are clickable chips (word → tooltip: root, lemma, category → link). `?ayah=255` scrolls and highlights.
5. **Roots `/roots/`** — grouped by first letter with counts; text filter.
6. **About `/about/`** — provenance table, license, methodology (what counts as an occurrence: segments with `ROOT:`; particles/pronouns excluded), offline/install instructions, GitHub link.

### Search & autocomplete behaviour (`useSearch.ts`)
- Debounce 80 ms; input classified: Arabic (contains U+0600–U+06FF) vs Latin.
- Arabic: normalize (see decisions) → prefix match on roots (exact root first), then lemmas, then surface forms; show up to 8 grouped results with kind badges (جذر / كلمة / آية) and counts. Enter on exact root → navigate.
- Latin: if it matches Buckwalter of a root (`ktb`) → root suggestion; else English keyword search over `en-index.json` → verse suggestions (top 8 by tf) and also roots whose gloss contains the word (top 3).
- Keyboard: ↑↓ Enter Esc; `/` focuses; results announced with `aria-live`.
- Recent searches in `localStorage` (max 10), clearable.

### Copy / export
- `navigator.clipboard.writeText` with toast; fallback `execCommand`.
- CSV columns: `surah, ayah, surah_name_en, surah_name_ar, word_index, form, lemma, root, category, tags, verse_uthmani, translation`.
- Markdown: `### 2:255 — البقرة` + blockquote verse + translation.
- Filenames `root-كتب-YYYYMMDD.csv`.

### Responsive
- Mobile: search full-width sticky under header; explorer cards single column; frequency chart collapses to list; filters in a bottom sheet. Desktop ≥1024px: two-column root page (summary sidebar sticky left, explorer right).
- Safe-area insets for iOS standalone; `viewport-fit=cover`; `theme-color` meta for both schemes.

---

## PWA

- `public/manifest.webmanifest`: name "Quran Root Research", short_name "Roots", `start_url: "/"`, `display: standalone`, `dir: auto`, `lang: en`, background/theme colors (obsidian), icons 192/512 + maskable, `categories: ["education","reference"]`, `shortcuts` (Browse roots, Random root).
- `<link rel="manifest">`, `apple-mobile-web-app-capable`, `apple-touch-icon`, `theme-color` in `layout.tsx` metadata.
- `scripts/build-sw.ts` (postbuild) writes `out/sw.js`:
  - `PRECACHE = [ '/', '/offline.html', '/manifest.webmanifest', all `/_next/static/**`, `/data/v1/{manifest,meta,index,forms,en-index}.json`, icons, fonts ]` — app shell installs immediately (~1 MB gz).
  - **Background full-offline prefetch**: after `activate`, the client (`registerSW.ts`) calls `sw.postMessage({type:'PREFETCH_ALL'})` when `navigator.connection?.saveData !== true`; SW fetches `/data/v1/surahs/*.json`, `/data/v1/roots/*.json`, `/data/v1/lemmas/*.json` in batches of 20 into a `data-{hash}` cache (hash from `manifest.json`, baked into `sw.js` at postbuild). UI shows progress in `OfflineBadge` ("Offline ready 63%") and a manual "Download all for offline" button in Settings/About.
  - Strategies: `/_next/static/*` cache-first (immutable); `/data/*` cache-first with version-keyed cache (data version from `meta.json` build hash baked into `sw.js`); HTML navigations network-first → cache → `/offline.html`; everything else stale-while-revalidate.
  - `skipWaiting` on message; `registerSW.ts` shows "Update available — reload" toast on `controllerchange`.
- `InstallPrompt.tsx`: capture `beforeinstallprompt`, show a dismissible banner after the 2nd visit on Android/desktop; on iOS Safari show "Share → Add to Home Screen" hint once.
- Verify with Lighthouse PWA audit (installable, offline start URL 200 from SW).

---

## Implementation steps (ordered for the executing model)

1. **Scaffold**: `pnpm create next-app@latest . --ts --tailwind --app --src-dir --eslint --no-import-alias`, then set `next.config.ts` (export, trailingSlash, images.unoptimized), add lucide-react, tsx, vitest, prettier. Commit.
2. **Shared pure libs first (TDD)**: `src/lib/arabic/normalize.ts`, `src/lib/morphology/classify.ts`, `src/lib/highlight.ts`, `src/lib/export/formatters.ts` + tests.
3. **Data pipeline**: `scripts/lib/*.ts`, `scripts/build-data.ts`; run it, inspect `public/data` size report; make `pnpm data:check` assert invariants (77,429 words, 6,236 verses, 1,651 roots, 4,776 lemmas, every root file parses, per-verse token counts match or fallback flagged). Commit (raw + output git-ignored).
4. **Types + loader hooks**: `src/lib/data/types.ts` (single source of truth, also imported by scripts), `loader.ts` with in-memory cache + `prefetchAll()`.
5. **Layout + theme + fonts + design tokens**; Header/Footer/ThemeToggle.
6. **Search**: `useSearch.ts`, `SearchBox`, `SuggestionList`; home page.
7. **Root page** (+ `generateStaticParams` reading `public/data/v1/index.json` at build via `fs`; server component reads `roots/{root}.json` for the static summary): RootHeader → FrequencyChart → FormsTable → AyahExplorer → ExportMenu.
8. **Word page, Surah page, Roots browse, About, not-found.**
9. **PWA**: manifest, icons (generate SVG → PNG with `sharp` in a one-off script or commit PNGs), `build-sw.ts`, `registerSW.ts`, InstallPrompt, OfflineBadge.
10. **Polish**: mobile bottom-sheet filters, keyboard shortcuts, `aria`, RTL checks, Lighthouse ≥ 95 perf/a11y/PWA.
11. **README + LICENSE + CI**; push; open draft PR.

---

## Verification

- `pnpm data:check` passes the invariants table (130,030 / 77,429 / 6,236 / 1,651 / 4,776 / 50,269; كتب = 319, رحم = 339, علم = 854) and prints a size table (budgets: `index.json` ≤ 300 KB raw, `forms.json` ≤ 600 KB raw, `en-index.json` ≤ 900 KB raw, largest root shard `أله` ≤ 150 KB raw, whole `public/data/v1` ≤ 9 MB raw / ≤ 3 MB gz). Fewer than 50 verses in `manifest.mismatches`.
- `pnpm test` (Vitest): normalization (`كِتَٰبُ`→`كتاب`, `ٱلرَّحْمَٰنِ`→`الرحمن` with altKey `الرحمان`, root key `أمن`→`امن`), classify mapping table incl. the three sample rows, parser joins segments of 1:1 into `بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ`, highlighter on 1:1 word 3 and on a verse where the root occurs twice, CSV escaping of quotes/commas in translations, English stemmer idempotence.
- `pnpm build` → `out/` contains 1,651 root pages, ~4,776 word pages, 114 surah pages, `sw.js` with precache manifest; `npx serve out` and check: `/root/كتب/` shows total 319, highlight lands on the right token in 2:2 (word 2), 2:79 (word 3) and 96:4; `/root/قول/` paginates without jank; English search "knowledge" returns verses; typing `ktb` suggests root كتب; export CSV opens in a spreadsheet.
- Offline: Chrome DevTools → Application → SW → Offline: reload `/`, search كتب, open root page, open a surah — all work after "Download all for offline"; before that, previously visited roots work.
- Lighthouse (mobile): PWA installable, performance ≥ 90 on root page.
- Vercel: import repo, framework Next.js, build `pnpm build` (prebuild runs data pipeline — needs network to GitHub raw + jsDelivr, both allowed by default on Vercel), output `out`. Confirm `/root/%D9%83%D8%AA%D8%A8/` serves.
