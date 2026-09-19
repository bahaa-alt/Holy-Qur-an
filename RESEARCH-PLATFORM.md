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
| Data pipeline  | all invariants pass; 130,030 segments / 77,429 words / 6,236 verses / 1,651 roots / 4,776 lemmas / 50,269 rooted occurrences |
| Shipped corpus | 12.7 MB raw, **3.4 MB gzipped**, fully offline                                                                               |
| Source lines   | ~24,300 TS/TSX                                                                                                               |
| `out/`         | 692 MB (`word/` 338 MB, `root/` 234 MB, `data/` 56 MB)                                                                       |

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

## 5. Open questions worth resolving early

- **Is a Qur'anic syntactic treebank obtainable under a usable licence?** The Quranic Arabic
  Corpus has _iʿrāb_ dependency data, and `kaisdukes/quranic-corpus` (QAC v2) is reachable
  from this environment — but its README states the grammar diagrams are only ~50% complete,
  and the data files were not locatable at the paths tried here. Worth a focused look: it
  would be the single largest capability jump available, and it would make Layer 1's syntax
  panel real rather than inferred.
- **Are _qirāʾāt_ available in structured form anywhere reachable?** This is the most-asked-for
  apparatus in Qur'anic studies and the tool's most conspicuous gap. Unknown as of this review.
- **What is the deployment ceiling?** `out/` is 692 MB, because every root and word page
  statically embeds its full tables plus RSC payload (`word/` 338 MB over 4,783 pages;
  `root/` 234 MB over 1,651). It builds and deploys today, but GitHub Pages has a 1 GB soft
  limit and Sprint 2 adds 6,236 pages. Rendering a summary statically and hydrating the
  tables client-side would likely cut this by most of its bulk — worth measuring before the
  verse pages land, not after.

---

## 6. The one-line version

The hard part — a trustworthy, offline, fully-annotated Qur'anic corpus with real
corpus-linguistic machinery — is **built and working**. What is missing is the thin layer
that turns a corpus into an instrument: _a way to ask arbitrary questions, a place to put
the answer, and a way to prove it to someone else._
