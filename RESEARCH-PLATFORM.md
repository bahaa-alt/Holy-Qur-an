# From root browser to research instrument — a review and a blank-sheet redesign

> Companion to [`PLAN.md`](./PLAN.md), which describes what was built. This document
> reviews it against one question — _is this the best tool a researcher working on the
> Qur'an could have?_ — and redesigns it from a blank sheet against that bar.
>
> Every claim below is measured against the tree at `c2197fb`, with a clean
> `pnpm install && pnpm data:build && pnpm test && pnpm build` in front of it.

---

## 1. Where it actually stands

Measured, not estimated:

|                |                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Build          | clean — `pnpm build` exits 0, 6,910 static pages                                                                             |
| Tests          | 447 passing across 65 files                                                                                                  |
| Data pipeline  | all invariants pass; 130,030 segments / 77,429 words / 6,236 verses / 1,651 roots / 4,783 lemmas / 50,269 rooted occurrences |
| Shipped corpus | 12.7 MB raw, **3.4 MB gzipped**, fully offline                                                                               |
| Source lines   | ~24,300 TS/TSX                                                                                                               |
| `out/`         | 692 MB by `du`, but only 584.2 MiB of content — see §5.3                                                                     |

This is not a prototype. It is a well-engineered, genuinely useful piece of software, and
several of its decisions are better than what most comparable tools do:

- **The pipeline has a spine.** Deterministic emit, sorted keys, size budgets that fail
  the build, a `--check` mode that asserts corpus invariants, sha256-logged downloads,
  and a documented fallback when the two text sources disagree on token counts (10 verses
  today, recorded in `manifest.mismatches` rather than silently papered over).
- **The corpus-linguistic primitives are real.** KWIC lines, PMI-scored collocations,
  PMI-scored root co-occurrence, n-gram formula extraction, Jaccard verse similarity,
  distinctive vocabulary by relative rate, hapax detection, fāṣila (verse-ending) analysis,
  verb–preposition valency. Most "Quran app" projects ship none of this.
- **The methodological honesty is exemplary.** The preamble to
  `src/lib/topics/topicDefinitions.ts` — explaining that a curated root index is a way to
  _find candidate verses_, not a verdict on what a verse means — is the single best thing
  in the repository. It is the voice this whole tool should speak in.
- **Account-less, server-less, offline-first** is a serious scholarly asset, not just a
  technical flex. A researcher on a field trip, behind a censoring firewall, or on an
  institution's air-gapped machine can use this. Almost nothing else in this space can say that.

So the redesign below is not a rescue. It is an argument that the project has outgrown its
own premise and should be re-pointed at a harder target.

---

## 2. The gap between "root browser" and "research instrument"

### 2.1 It answers questions; it does not let you ask them

`/search/advanced` exposes exactly five facets (`AdvancedSearchQueryState`): categories,
verb Forms, revelation place, a set of roots, and a surah range — combined as AND, with the
roots OR'd. That is a good filter panel. It is not a query interface.

None of these are expressible today:

- root X **followed within three words by** root Y
- imperative verbs **not** preceded by a vocative
- passive verbs of any root (see 2.2 — the tag exists, the facet does not)
- any restriction construction (_ḥaṣr_) anywhere in the text
- a sequence: `[conditional particle] … [verb, perfect] … [verb, jussive]`
- the same query, but scoped to the first twenty surahs in revelation order

A researcher's work is _building_ a query until it isolates a phenomenon. Checkboxes can
only select from phenomena someone else already named.

### 2.2 It downloads a full grammatical annotation and throws most of it away

This is the most consequential finding in this review, and the cheapest to fix.

`data/raw/quran-morphology.txt` carries roughly **60 distinct feature tags** per segment.
`src/lib/morphology/classify.ts` reduces them to **10 display categories** — and runs _only_
on segments that carry a `ROOT:`, because the project defines an "occurrence" as a rooted
segment. Two things fall through that grate:

**Passive voice is invisible.** 1,151 segments are tagged `PASS`. Every one of them is
rooted, so it is already sitting in `occurrences.json` — but `classify()` never looks at
`PASS`, so a passive perfect verb and an active perfect verb are the same `verb.perf` to
every facet, chart, and export in the app. "Show me every passive construction in the
Qur'an" is a first-order research question and the tool cannot answer it with data it
already has on disk.

**The entire rhetorical layer is excluded by definition.** These tags sit on _rootless_
segments, so the "occurrence = rooted segment" rule drops them wholesale:

| Tag    | Count | What it marks                              |
| ------ | ----: | ------------------------------------------ |
| `REM`  | 2,925 | resumption particle (_istiʾnāf_)           |
| `NEG`  | 2,696 | negation                                   |
| `EMPH` | 1,244 | emphatic _lām_                             |
| `COND` | 1,024 | conditional                                |
| `INTG` |   815 | interrogative                              |
| `SUB`  |   671 | subordinating particle                     |
| `RES`  |   557 | **restriction / _ḥaṣr_** (`إنّما`, `إلّا`) |
| `ATT`  |   523 | attention particle (_alā_)                 |
| `CERT` |   415 | certainty (_qad_)                          |
| `VOC`  |   366 | vocative                                   |
| `RSLT` |   350 | result                                     |
| `PRO`  |   332 | prohibition                                |
| `PRP`  |   319 | purpose                                    |
| `CIRC` |   293 | circumstantial _wāw_ (_ḥāl_)               |

**10,252 segments** carrying the machinery of Qur'anic rhetoric — restriction, condition,
circumstance, prohibition, oath, emphasis — are downloaded, parsed, and then discarded
before they reach any index. `tagLabels.ts` already carries EN + AR labels for every tag in
the table above — and for `PASS` too (`"Passive voice" / "لم يسمّ فاعله"`). The labels exist,
the data exists; only the indexing and the query surface are missing.

For a tool whose audience includes anyone working on _balāgha_, _iʿrāb_, or Qur'anic
stylistics, this is the difference between a vocabulary tool and a grammar tool.

### 2.3 Sample of one, in every dimension

| Dimension        | What ships                                           | What research needs                                          |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| Arabic text      | one (Ḥafṣ Uthmani)                                   | at minimum, awareness that others exist                      |
| Translations     | two (Saheeh Int'l, Pickthall)                        | four or more, with translator, date, school, license         |
| Lexicon          | one, third-hand (Lane, via an MIT JSON re-packaging) | Lane proper, Lisān, Qāmūs, Mufradāt                          |
| Tafsīr           | **zero in the app**                                  | several, compared                                            |
| Chronology       | one (Cairo 1924)                                     | Cairo _and_ Nöldeke, side by side, switchable                |
| Variant readings | none                                                 | _qirāʾāt_ — the most-requested apparatus in Qur'anic studies |
| Syntax           | POS + features only                                  | _iʿrāb_ / dependency structure                               |

The tafsīr line is the sharp one: **6 MB of Tafsīr al-Jalalayn is already committed to this
repository** at `references/tafsir/ar-tafsir-al-jalalayn/`, one file per surah, and the app
never reads it. `scripts/fetch-tafsir.ts` can pull al-Rāzī, al-Zamakhsharī and al-Ālūsī on
demand, verified working. Meanwhile `references/grammar-lexicon/manifest.json` is a careful,
honest record of nine classical works that were searched for and not obtained.

Comparison across witnesses is the basic motion of textual scholarship. The tool currently
has no witness layer at all — it presents one reading of one text as _the_ text.

### 2.4 The unit of analysis is the root; the unit of scholarship is the verse

There is no verse page. `2:255` is `/surah/2/?ayah=255` — a query parameter against a
286-verse document. Consequences:

- **Nothing to cite.** No canonical URL for a verse.
- **Nowhere to put an apparatus.** Morphology, _iʿrāb_, translations, tafsīr, lexicon
  entries, parallels, cross-references, metrics — these all belong to a _verse_, and the
  architecture has no place to hang them.
- **Nothing to link to.** Every cross-reference feature the app already computes
  (formulas, verse similarity, co-occurrence) wants to point at a verse and can only point
  at a scroll position.

Root-first was the right call for v1. It is the wrong centre of gravity for a research tool.

### 2.5 Ratios presented as findings; gematria shelved next to grammar

**The statistics stop one step short.** `build-distinctive-vocab.ts` ranks by
`localRate / globalRate` with `MIN_LOCAL_COUNT = 3`. A root appearing 3 times in a short
surah will outrank a root appearing 40 times in a long one, and the ranking has no way to
say which is noise. Corpus linguistics has standard answers — log-likelihood (Dunning),
effect sizes, dispersion measures (DP, Juilland's _D_), confidence intervals — and the
project already computes PMI elsewhere, so the statistical literacy is clearly present. It
just is not applied consistently.

**The Abjad problem is one of standing, not correctness.** Classical Abjad numerology
occupies: a top-level tab on `/insights/`, four components, three library modules, three
test files, 245 KB of build output, a corpus-wide reverse-lookup index, and a
"which words share this value" cluster index. The code is clean and well tested. But placing
gematria on the same nav shelf as morphological analysis tells a visiting researcher
something about the tool's epistemics, and what it tells them is not what this project
deserves given the care in `topicDefinitions.ts`.

This is not an argument to delete it. It is an argument that _shelving is a claim_.

### 2.6 Findings made here cannot be reproduced

`buildCitation()` emits a prose string. There is no BibTeX, RIS, or CSL-JSON. There is no
permalink that pins a result set to a dataset version. A reader handed a claim from this
tool — "root X clusters in Meccan surahs" — has no way to re-run it and check.

The raw material for this is _already there_: `manifest.json` carries a build `hash`
(`353b83f3…` on this build), `version`, and `builtAt`, and `/search/advanced` already
round-trips its full state through the URL. The pieces have never been connected.

---

## 3. Blank sheet

> **A Qur'anic corpus workbench: a queryable, citable, multi-witness apparatus that runs
> entirely in the reader's browser.**

Keep every current constraint — no accounts, no server, works offline, static export. They
are features. Change what sits on top of them.

Three layers, plus one cross-cutting commitment.

### Layer 1 — The Apparatus: the verse becomes the atom

A canonical page per verse: `/v/2:255/`. 6,236 of them. The build already emits 6,910
pages, so this is affordable within the existing architecture.

Every panel collapsible, every panel sourced, every panel citable:

1. **Text** — Uthmani rasm, word-aligned.
2. **Morphology** — every segment, _every_ tag, with EN/AR labels (`tagLabels.ts` already
   has them) — not the 10-category reduction.
3. **Syntax** — clause structure from the particle tags in §2.2; full _iʿrāb_ if a treebank
   can be obtained (see §5).
4. **Translations** — side by side, ≥ 4, each with translator, year, and licence.
5. **Tafsīr** — al-Jalalayn ships (it is already in the repo); al-Rāzī, al-Zamakhsharī,
   al-Ālūsī fetched on demand into the offline cache.
6. **Lexicon** — the full Lane entry for each root in the verse, not the 140-character
   `glossShort`.
7. **Parallels** — formulaic (exact recurring n-gram) and structural (root-set Jaccard).
   _Both already computed and shipping._
8. **Cross-references** — verses sharing this verse's rarest roots. _Already computed._
9. **Variants** — _qirāʾāt_, when sourced. Until then, the panel says "not yet sourced"
   rather than not existing, so the absence is visible.
10. **Metrics** — fāṣila, word/root/segment counts, Meccan/Medinan, position in both Cairo
    and Nöldeke chronologies, juzʾ/ḥizb. _All already computed._

Note how much of this is assembly rather than new computation. The data is built; it has
nowhere to land.

### Layer 2 — QCQL: a real query language

A small, documented, versioned query language over the occurrence index — the checkbox
facets' honest successor.

```
# every passive verb from the root علم
[root=علم & pos=V & PASS]

# ḥaṣr (restriction) followed within three words by a divine name
[RES] []{0,3} [root=أله | root=رحم]

# imperatives in Meccan surahs, excluding the first five revealed
[pos=V & IMPV] :: meccan & chrono > 5

# conditional particle, then a perfect verb, then a jussive — anywhere
[COND] [pos=V & PERF] [pos=V & MOOD=JUS]

# root كتب immediately followed by any preposition
[root=كتب] [pos=P]
```

Design commitments:

- **Compiles to a plan over the flat indices that already exist** (`occurrences.json`,
  `ar-index.json`, `verse-roots.json`), plus the recovered tags from §2.2. Runs client-side.
  No new server, no new runtime dependency.
- **Every query is a URL.** Every result set has a stable count, a permalink, and an export.
- **The GUI writes the query.** The facet panel stays exactly where it is — but instead of
  filtering directly, it _composes QCQL into a visible query box_. This is how AntConc,
  Sketch Engine and ANNIS onboard people: the GUI is the tutorial. Nobody has to learn a
  language to start, and nobody is capped by the GUI once they have.
- **Versioned.** `QCQL v1` in the permalink, so a saved query keeps meaning what it meant.

### Layer 3 — The Notebook: research is iterative

Today `/saved` bookmarks pages with notes in `localStorage`. Research does not work in
pages; it works in _sets_.

- **Save queries, not just pages.** A saved query re-runs; a saved page is a souvenir.
- **Set algebra over result sets** — `A ∩ B`, `A − B`, `A ∪ B`. "Verses with root X but not
  root Y" is a two-click operation and currently impossible.
- **Annotate hits.** Per-occurrence notes and user tags, filterable.
- **Group into studies.** A named collection of queries, sets, annotations and prose.
- **Export a study** as CSV / JSON / Markdown — _and_ as a self-contained HTML file that
  re-runs its own queries against a pinned dataset hash.
- **Share without a server.** A study serialises into a URL fragment, or downloads as
  `.qstudy.json`. The account-less constraint holds.

The existing "Names Phrases" editable list is, structurally, a user study that predates the
Notebook. It should become one.

### Cross-cutting — Provenance and reproducibility

The commitment that separates a research instrument from a reference app: **every number on
screen can explain and defend itself.**

- A `?` beside every computed figure → "computed as _…_, over dataset v1 @ `353b83f3`,
  N = …, excludes …".
- **Citation exports that are citations**: BibTeX, RIS, CSL-JSON — for a verse, a root, a
  query, or a whole study.
- **Permalinks pin the dataset hash.** A link from a footnote resolves to the same numbers
  the author saw, or says plainly that the dataset moved.
- **The corpus becomes a citable dataset**: a Frictionless `datapackage.json` and a
  Croissant descriptor beside the existing `corpus.csv`, with a stable schema doc.
- **Statistics with inference**: log-likelihood and effect size beside every ratio;
  dispersion (DP) beside every raw frequency; an explicit small-N warning where it applies.
  Re-rank distinctive vocabulary accordingly.
- **A `/limits` page.** What this tool _cannot_ tell you: no _qirāʾāt_ yet; topics are
  keyword proxies and not tafsīr; counts follow Quranic Arabic Corpus conventions and will
  differ from tools that count whole tokens; 10 verses use the morphology fallback. Stating
  limits plainly is how a tool earns trust from people trained to look for them.

### What moves, and why

|                   |                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Abjad**         | Moves off the main nav to a clearly-labelled `/curiosities/`. Keep the code — it works and it is tested. Change what its placement claims. |
| **Names Phrases** | Becomes a Notebook study — which is what it already is.                                                                                    |
| **`/insights/`**  | Splits: statistically defensible findings graduate into the query layer and the verse apparatus; the rest joins curiosities.               |

---

## 4. Sequencing

Ordered by researcher value per unit of effort. Each ships on its own.

**Sprint 1 — Stop discarding grammar.** _Highest value, lowest risk, no new data sources._
Carry the full tag set through the pipeline into the occurrence index; add `PASS` to
`classify()`; index the 10,252 rootless syntactic segments as first-class searchable items
with their own facet. Unlocks passive voice, _ḥaṣr_, conditionals, _ḥāl_, vocatives,
prohibitions and rhetorical questions — from data already on disk. Update the About page's
"what counts as an occurrence" section, which this changes.

**Sprint 2 — The verse page.** `/v/{s}:{a}/` assembling morphology, translations, parallels,
cross-references and metrics that already exist, plus al-Jalalayn from `references/`.
Canonical citable URL; BibTeX / RIS / CSL-JSON export. Repoint every existing cross-reference
feature at it.

**Sprint 3 — QCQL v1.** Grammar, parser, planner over the existing indices; query box; the
facet panel rewired to compose queries; result permalinks and exports.

**Sprint 4 — The Notebook.** Saved queries, set algebra, annotations, studies, serialisation.

**Sprint 5 — Witnesses.** More translations (needs a reachable multi-translation source —
note that jsDelivr's `/gh/` path is blocked from this environment while its npm path works,
so verify before committing to one); tafsīr fetched on demand; Nöldeke alongside Cairo.

**Sprint 6 — Statistics and provenance.** Log-likelihood, dispersion, small-N warnings,
provenance popovers, `datapackage.json`, `/limits`.

---

## 5. The three open questions, resolved

All three were investigated, and every "obtainable" claim was re-fetched by an independent
adversarial pass before being recorded here. Two of the three answers overturned what this
document originally assumed.

### 5.1 The treebank — obtained twice; the usable one is not the famous one

`kaisdukes/quranic-corpus` bundles **no data at all**: it is an axios client against
`https://qurancorpus.app/api`. The data lives in the public backend `kaisdukes/quranic-corpus-api`,
which clones fine — `syntax.txt`, 1.9 MB, 7,373 dependency graphs, 45 relations, 45,087 edges,
1,853 elided-word nodes.

**Coverage is worse than the README's "~50%", and the gap is structural, not scattered:**
42.12% of tokens (32,617 / 77,430) and 39.06% of verses (2,436 / 6,236), covering **surahs 1–9
and 59–114 only — 10–58 are entirely absent**. That is confirmed in their own source
(`LegacyCorpusGraphMapper.java`: `GAP_CHAPTER_NUMBER_START=9`, `GAP_CHAPTER_NUMBER_END=58`).

**It cannot ship here.** The repo has no LICENSE file of any kind; two sibling READMEs ask
explicitly, under a heading of their own, that the draft data not be redistributed; its
`irab.tsv` is a transcription of a modern copyrighted grammar; and its Qur'an text is Tanzil
under CC BY-ND. The frontend's GPL-3.0 does not reach across repositories.

The usable substitute is **`NoorBayan/Quranic` — MIT, 139,376 rows, 51 columns, extended
CoNLL-X, 100% coverage**, which joins to this project's existing `surah:ayah:word:segment`
keys at **98.598%** (128,207 matched; every unmatched key a deictic clitic it merges into the
stem). It is demonstrably the same corpus: 98.98% identical surface forms after normalisation,
98.63% root agreement against exactly the 50,269 rooted occurrences this project counts.

Three caveats that must travel with it:

1. **"100% annotated" is overstated.** 15.4% of rows carry the literal value `NonRel` and
   another 14,166 are `root`; only **74.5% bear an actual syntactic relation**.
2. **Provenance is unresolved.** The accompanying paper describes a layer built by
   "algorithmic conversion, Deep Learning-based parsing, and expert validation" — which would
   mean the 58% Dukes never annotated by hand may be **machine-parsed**. This rests on a search
   snippet; the DOI and Mendeley record are unreachable from here. **Settle this before shipping.**
3. Its `location` values are parenthesised (`(1:1:1:1)`), so a naive `split(':')` still yields
   four parts and fails silently.

Measured integration cost: a per-surah sharded `syntax/{n}.json` adds **1,481.1 KB raw /
333.8 KB gz**, which requires raising `TOTAL_RAW_BUDGET` — see §5.3.

**A finding that cuts both ways.** The upstream QAC copyright block (recovered from a PyPI
package) reads "License: GNU Public License" and then "Permission is granted to copy and
distribute VERBATIM copies of this file, but CHANGING IT IS NOT ALLOWED." Meanwhile
`mustafa0x/quran-morphology` — the morphology this app is **built on** — has no LICENSE file
either, while `build-data.ts` and the README both assert "GPL". The Dukes data cannot be
rejected on a licensing ground that also condemns the corpus already shipping. That is a
maintainer decision and belongs in `references/grammar-lexicon/manifest.json`.

### 5.2 Qirāʾāt — parallel text obtained; a citable apparatus was not

**The cheapest source was already a production dependency.** `scripts/build-data.ts` defines
`PICKTHALL_URL` pointing at `raw.githubusercontent.com/fawazahmed0/quran-api/1/...`. That same
repo, same branch, same URL shape, same `fetchCached` path, same **Unlicense** grant, serves
**eight riwāyāt** — Ḥafṣ, Warsh, Qālūn, Dūrī, Sūsī, Bazzī, Qunbul, Shuʿba — at 6,236 verses each.
Adding them is a constant in an existing array.

The data is genuinely divergent, not relabelled Ḥafṣ: Warsh differs from Ḥafṣ in 6,211 of 6,236
verses, while Shuʿba — sharing ʿĀṣim with Ḥafṣ — differs in only 552. The divergence tracks the
isnād, which is strong evidence of authenticity. **Disclosure required if shipped:** the
non-Ḥafṣ editions are re-segmented onto Kufi verse boundaries (native Warsh is 6,214 verses),
so the wording is Warsh and the division is Ḥafṣ-normalised.

**The dataset that looked like an apparatus was declined.** `qiraat-variants.json` (1,634 loci)
fails a source-citation test outright: across its 1.3 MB the substrings `edition`, `page`,
`volume`, `tariq`, `Shatib`, `Taysir` and `isnad` each occur **zero** times. Its notes cite bare
surnames with no work, edition or locator. Its attribution is classically correct on spot-checks,
but a research tool cannot cite it. Separately, three of the four parallel-text candidates trace
back to one unlicensed upstream (`thetruetruth/quran-data-kfgqpc`, no LICENSE); only
**fawazahmed0 (Unlicense)** and **@saqfish (GPL-3.0)** stand outside that chain.

**What did clear the bar** is narrower and better: `quranpedia/qiraat-ayah-map` cites every one
of the six ʿadd traditions to al-Dānī's _al-Bayān_, by edition and page — madanī-first 6217,
madanī-last 6214, makkī 6219, baṣrī 6204, dimashqī 6226, kūfī 6236.

**The finding that matters most needs no dataset at all: this app never names its own reading.**
`grep -rniE 'hafs|ḥafṣ|warsh|qira'` across `src/` and `scripts/` returns nothing. The only
descriptor anywhere is "the Uthmani text". What ships is **Ḥafṣ ʿan ʿĀṣim in the 1924 Cairo
orthography with Kufan numbering** — verifiable in the data itself, where `surahs/42.json`
splits `حمٓ` and `عٓسٓقٓ` into verses 1 and 2, the Kufan count. By this project's own standard,
not saying so is already an overclaim.

**And qirāʾāt would hit the core, not sit beside it.** `2:259 نُنشِزُ` (root نشز) becomes
`نُنشِرُ` (root نشر) under another canonical reading; `10:30 تَبْلُوا۟` (بلو) becomes
`تَتْلُوا۟` (تلو). Both target roots already exist in `index.json` with live counts. **A
one-dot difference moves an occurrence from one root page to another and changes both counts.**
The root index — the thing this project is — is a Ḥafṣ artifact, and
`surah:ayah:word:segment` is reading-dependent at its two rightmost components. Never attach the
existing morphology to a variant reading.

Verse numbering is a separate discipline from the reading (the counting tradition belongs to the
_edition_, not the _qirāʾa_), and conflating them produces two silent failures: cumulative drift,
where a join returns a real, well-formed, **wrong** verse; and equal totals with different
division, where al-Fātiḥa is 7 verses everywhere but the Kufan count reaches 7 by counting the
basmala — so a per-surah total check passes while the text differs.

**Minimum responsible version:** Stage 0, name the reading everywhere including `buildCitation`
— ship regardless, it is not a qirāʾāt feature. Stage 1, the honest null panel this document
already proposes. Stage 1.5, the sourced ʿadd layer, buildable today. Stage 2, farsh only,
symmetric, sourced per locus, morphology-firewalled, **zero computed content** — only if citable
data appears. One number to defuse first: the 68.6% of word slots on which riwāyāt "disagree" is
mostly diacritics; the substantive count is **632**.

### 5.3 The size ceiling — measured, and it breaches

The original claim in this document was wrong about both the cause and the remedy.

**`du`'s 692 MB overstates content by 108 MiB** — that is 4 KiB block quantization across 36,530
files. Apparent content is 584.2 MiB.

**The dominant cost is not page tables; it is Next.js 16 prefetch artifacts.** 285.6 MiB (48.9%)
is RSC payload, more than the 247.1 MiB of HTML, and the same payload is written **four times per
page**: inline in `index.html`, as `index.txt`, as `__next._full.txt`, and as `__PAGE__.txt`.
Verified independently in this repo: `index.txt` is **byte-identical to `__next._full.txt` on
6,909 of 6,909 pages, zero differing**, and `__next.*` totals **189.0 MiB across 20,727 files** —
57% of the file count.

Double serialization within a page is also real (10 of 12 `src/components/root/` components are
`"use client"`, so every datum ships as HTML _and_ JSON props; the 61-entry `bySurah` array ships
three times) — but it is second-order. Note that `AyahExplorer` **already** fetches
`/data/v1/roots/{root}.json` client-side, so the static tables duplicate JSON that already ships.

**Over the wire this is a non-issue** — a root page is 10,537 B brotli — but compression buys
nothing against a published-site limit.

**The projection breaches.** 6,236 verse pages at today's per-page cost add ~441 MiB on disk →
**~1.13 GB**. Correction to this document's earlier text: GitHub's 1 GB is a **hard** limit
("Published GitHub Pages sites may be no larger than 1 GB", with bandwidth and build count
explicitly labelled _soft_). There is no version of Sprint 2 that fits today's cost structure.

Ranked remedies, each measured by controlled A/B builds:

| #   | Remedy                                             |                     Saved | Risk                                        |
| --- | -------------------------------------------------- | ------------------------: | ------------------------------------------- |
| 1   | `find out -name '__next.*' -delete` in `postbuild` | **189.0 MiB**, −57% files | medium — **not browser-verified**           |
| 1a  | _Fallback:_ delete only `__next._full.txt`         |                  96.6 MiB | low — `index.txt` still serves navigation   |
| 2   | Root page → static summary + hydrated tables       |                 130.3 MiB | medium — needs `sitemap.ts` shipped with it |
| 3   | `corpus.csv` → release asset                       |                  37.5 MiB | near zero                                   |
| 4   | Word page → thin shell                             |                  52.6 MiB | medium — costs the word↔word link graph     |
| —   | `cacheComponents` / PPR / `dynamicParams`          |                         — | **impossible under `output: 'export'`**     |

Full stack ≈ 233 MiB, a 60% cut. **Start with #1**, gated on one browser navigation test — it is
the only remedy attacking both binding constraints (bytes and file count) at once, and the
`sw.js` `staleWhileRevalidate` fallthrough currently makes all 285.6 MiB eligible to accumulate
in every visitor's Cache Storage, so it is a client-storage fix too.

**Two deploy blockers nobody had looked for.** There is **no `.nojekyll`** in `public/` or `out/`
and nothing generates one — so the `build:ghpages` path would have Jekyll strip `_next/`,
serving an unstyled, non-hydrating site. That is harder than any size limit, because an overrun
degrades gracefully and this does not. And Cloudflare Pages is out entirely: 20,000-file free
limit against 36,530 files, plus a 25 MiB per-asset cap against a 37.5 MiB `corpus.csv`.

### 5.4 Still genuinely unknown

- Whether NoorBayan's surahs 10–58 are human- or machine-annotated (DOI unreachable from here).
- Whether CC BY 4.0 data can be redistributed inside a GPL-3.0 project, and whether
  `quran-text`'s third-party carve-out defeats it. **This needs a human, not another agent.**
- Whether deleting `__next.*.txt` degrades gracefully to full-page navigation. Code-read twice,
  browser-verified never — no headless browser exists in this environment. It gates the largest remedy.
- Vercel's actual limits — `vercel.com/docs/limits` is unreachable, and Vercel is the primary
  target named in both the README and `PLAN.md`, so this is the ceiling that matters most and the
  one nobody can evidence.
- Actual deploy time against GitHub Pages' 10-minute timeout, at 36,530 files and rising.

### 5.5 Two defects found in passing

- **`pnpm data:check` does not check sizes.** Despite its docstring, it omits `surahs/*.json`,
  includes the 38 MB `corpus.csv` the real build excludes, prints gz as literal `0.0 KB` for
  every row, and performs **no budget comparison at all**. Budgets are only enforced by CI's
  `Build` step.
- **`manifest.json` says 4,783 lemmas** (4,635 rooted + 148 rootless). The 4,776 figure in
  `PLAN.md` — and in §1 of this document as first written — is stale by seven.

### 5.6 One unplanned find worth more than it cost

Hunting qirāʾāt turned up **Lane's Lexicon as a GPL-3.0 SQLite database**
(`laneslexicon/LexiconDatabase`): 5,160 roots, 47,919 entries of TEI-XML. §2.3 lists the
lexicon as "one, third-hand" because the app currently shows a 140-character `glossShort`
taken from an MIT re-packaging. This is Lane proper, under a licence this project already
uses. It is the cheapest single upgrade to the verse apparatus in §3, and it was not on
anyone's list.

---

## 6. The one-line version

The hard part — a trustworthy, offline, fully-annotated Qur'anic corpus with real
corpus-linguistic machinery — is **built and working**. What is missing is the thin layer
that turns a corpus into an instrument: _a way to ask arbitrary questions, a place to put
the answer, and a way to prove it to someone else._
