import { CATEGORY_LABELS } from "@/lib/data/types";
import { ROOT_SHAPE_LABELS } from "@/lib/morphology/rootShape";
import type { Dict } from "./types";

/**
 * Canonical English dictionary -- these are the exact strings the app
 * shipped with before the language toggle existed. `ar.ts` is typed
 * against `Dict`, not against this object, so the two files can be edited
 * independently without one importing the other.
 */
export const en: Dict = {
  common: {
    search: "Search",
    copy: "Copy",
    copied: "Copied",
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    loading: "Loading…",
    loadingVerses: "Loading verses…",
    clearFilters: "Clear filters",
    prev: "Prev",
    next: "Next",
  },
  categories: CATEGORY_LABELS,
  rootShapes: ROOT_SHAPE_LABELS,
  nav: {
    logoFull: "Quran Root Research",
    logoShort: "Roots",
    quran: "Qur'an",
    roots: "Roots",
    search: "Search",
    topics: "Topics",
    names: "Names",
    insights: "Insights",
    syntax: "Syntax",
    saved: "Saved",
    about: "About",
  },
  footer: {
    tagline: "Free, open-source, no accounts, no servers.",
    dataAndLicenses: "Data & licenses",
    source: "Source",
  },
  notFound: {
    title: "Not found",
    message: "That root, word, or page doesn't exist. Try searching from the home page instead.",
    backToSearch: "Back to search",
  },
  themeToggle: {
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
  },
  languageToggle: {
    switchToArabic: "Switch to Arabic",
    switchToEnglish: "Switch to English",
  },
  offlineBadge: {
    offlineMode: "Offline mode",
  },
  serviceWorker: {
    updateAvailable: "Update available — reload",
  },
  installPrompt: {
    heading: "Install for offline use",
    body: "Add to your home screen to use it like a native app, offline.",
    install: "Install",
    notNow: "Not now",
    dismissAria: "Dismiss",
  },
  searchBox: {
    ariaLabel: "Search a root, word, or translation",
    placeholder: (example) => `Search a root, word, or translation… e.g. ${example}`,
  },
  suggestionList: {
    ariaLabel: "Search suggestions",
  },
  suggestionKind: {
    root: "root",
    lemma: "word",
    verse: "verse",
    search: "search",
  },
  home: {
    title: "Qur'anic Root & Word Research",
    subtitle:
      "Search by Arabic root, exact word, or English translation. Explore every derived form and every occurrence, free and offline, with no accounts and no servers.",
    mostFrequentRoots: "Most frequent roots",
    browseAllRoots: (count) => `Browse all ${count.toLocaleString()} roots →`,
  },
  dailyWidget: {
    rootHeading: "Root of the day",
    verseHeading: "Verse of the day",
    viewRoot: "Explore this root →",
    viewVerse: "Open in surah →",
  },
  quran: {
    title: "The Qur'an",
    subtitle:
      "All 114 surahs, in mus'haf order. Open any surah to read the full Uthmani text with translation, word by word.",
    filterPlaceholder: "Filter surahs by name or number…",
    noMatch: (query) => `No surahs match "${query}".`,
    meccan: "Meccan",
    medinan: "Medinan",
    versesCount: (count) => `${count.toLocaleString()} verses`,
  },
  roots: {
    title: "Browse all roots",
    subtitle: (count) => `${count.toLocaleString()} Qur'anic roots, grouped alphabetically.`,
  },
  rootsBrowser: {
    filterPlaceholder: "Filter roots…",
    byLetter: "By letter",
    byShape: "By shape",
    noMatch: (query) => `No roots match "${query}".`,
    rootsCount: (count) => `${count.toLocaleString()} roots`,
  },
  randomRootLink: {
    label: "Random root",
  },
  rootHeader: {
    rootLabel: "Root",
    fullyMeccan: "100% Meccan",
    fullyMedinan: "100% Medinan",
    meccanPct: (pct) => `${pct}% Meccan`,
    meaningLabel: "Meaning (after Lane's Lexicon): ",
    totalOccurrences: "Total occurrences",
    derivedLemmas: "Derived lemmas",
    distinctForms: "Distinct forms",
    verses: "Verses",
  },
  frequencyChart: {
    heading: "Frequency distribution",
    byCategory: "By category",
    byLemma: "By lemma",
  },
  formsTable: {
    heading: "Associated words & derivatives",
    subtitle: "Every distinct form derived from this root, with its lemma and count.",
    colForm: "Form",
    colLemma: "Lemma",
    colCategory: "Category",
    colCount: "Count",
  },
  conjugationTable: {
    unspecifiedPerson: "Unspecified",
    heading: "Verb conjugation",
    subtitle:
      "Attested forms by verb Form, aspect, and person/gender/number. Click a form to filter the explorer below.",
    form: (verbForm) => `Form ${verbForm}`,
    occurrencesCount: (count) => `${count.toLocaleString()} occurrences`,
  },
  surahDistribution: {
    heading: "Distribution across surahs",
    surahOrder: "Surah order",
    revelationOrder: "Revelation order",
    bySurahDescription: "Where this root's occurrences fall across the 114 surahs.",
    byRevelationDescription:
      "The same occurrences, ordered by the conventional chronological (revelation) sequence instead.",
  },
  wordPositionStats: {
    heading: "Position within the verse",
    description:
      "Where this word's occurrences fall in their verse -- the first word, the last word, or somewhere in between -- and the full breakdown by exact word position.",
    startsVerse: "Starts the verse",
    endsVerse: "Ends the verse",
    withinVerse: "Within the verse",
    byPositionHeading: "By exact position",
    positionLabel: (n) => `Word ${n}`,
    percentOfOccurrences: (pct) => `${pct}% of occurrences`,
  },
  collocations: {
    heading: "Co-occurring roots",
    description:
      "Roots most distinctively associated with this one -- ranked by how much more often they share a verse with it than their individual frequencies would predict, not just raw frequency.",
  },
  citeButton: {
    cite: "Cite",
    copied: "Citation copied",
  },
  compare: {
    title: "Compare roots",
    subtitle:
      "Pick up to three roots to compare their occurrence counts and category breakdowns side by side.",
  },
  compareView: {
    loadingRoots: "Loading roots…",
    pickAtLeastOneMore: "Pick at least one more root to compare.",
    heatmapHeading: "Where each root occurs across the Mushaf",
  },
  rootPicker: {
    heading: "Roots to compare",
    subtitle: (max) => `Pick up to ${max} roots to compare side by side.`,
    removeAria: (root) => `Remove ${root}`,
    searchPlaceholder: "Search for a root to add…",
  },
  compareStatsTable: {
    heading: "Stats",
    totalOccurrences: "Total occurrences",
    derivedLemmas: "Derived lemmas",
    distinctForms: "Distinct forms",
    verses: "Verses",
    surahs: "Surahs",
  },
  compareCategoryBars: {
    heading: "Category breakdown",
  },
  phrasesPage: {
    title: "Phrase search",
    subtitle:
      "Find every verse where a word from one root is immediately followed by a word from another -- skipping particles and pronouns in between -- for studying formulaic word-pair patterns.",
  },
  phraseSearch: {
    leadingRoot: "Leading root",
    followedBy: "Followed by",
    search: "Search",
    noResults: "No verses found where the leading root is immediately followed by the second root.",
    matchCount: (count, cap) =>
      `${count.toLocaleString()} match${count === 1 ? "" : "es"}${count > cap ? ` (showing the first ${cap})` : ""}.`,
  },
  rootSlotPicker: {
    clearAria: (label) => `Clear ${label}`,
    searchPlaceholder: "Search for a root…",
  },
  searchHub: {
    title: "Search",
    subtitle:
      "Three ways to search the corpus, side by side: exact phrases, root-pair patterns, and root comparisons.",
    tabSearch: "Text Search",
    tabPhrases: "Phrase Patterns",
    tabCompare: "Compare Roots",
    advancedSearchLinkLabel: "Looking for a grammatical pattern instead? Try Advanced Search →",
    queryLinkLabel: "Or write the question yourself: Query \u2192",
  },
  advancedSearchPage: {
    wordSyntaxLabel: "This word is",
    wordSyntaxHint:
      "The matched word itself carries this function. Mostly passive verbs \u2014 the particles that carry the other functions have no root, so they are not occurrences and cannot be matched this way.",
    verseSyntaxLabel: "Verse contains",
    verseSyntaxHint:
      "The function appears somewhere in the same verse, on any word. This is the one that composes: a root, filtered to where it sits inside a conditional or a restriction.",
    title: "Advanced search",
    subtitle:
      "Combine facets across the whole corpus -- category, verb Form, one or more roots, surah range, and Meccan/Medinan -- to find things no single root's own page can answer, like every Form VIII passive participle in the Medinan surahs, or every occurrence of either of two roots together.",
    loading: "Loading the corpus index…",
    categoryLabel: "Category",
    verbFormLabel: "Verb form",
    rootLabel: "Root",
    rootPlaceholder: "Type a root to narrow to it…",
    rootClear: (root) => `Remove root ${root}`,
    surahRangeLabel: "Surah range",
    surahFromLabel: "From",
    surahToLabel: "To",
    revelationLabel: "Revelation",
    revelationAll: "All",
    revelationMeccan: "Meccan",
    revelationMedinan: "Medinan",
    clearFilters: "Clear all filters",
    resultCount: (count) => `${count.toLocaleString()} matching occurrences`,
    noResults: "No occurrences match these filters.",
    pageOf: (page, total) => `Page ${page} of ${total}`,
    previousPage: "Previous",
    nextPage: "Next",
    verbFormShort: (roman) => `Form ${roman}`,
  },
  queryPage: {
    title: "Query",
    subtitle:
      "A query language over this corpus, for questions the facet checkboxes cannot ask. Every query is a link.",
    placeholder: "[root=\u0639\u0644\u0645 & cat=verb.perf]",
    run: "Run",
    examplesHeading: "Try",
    examples: {
      perfectFromRoot: "perfect verbs from \u0639\u0644\u0645",
      passiveFromRoot: "\u2026 in the passive",
      restriction: "every restriction particle (\u1e25a\u1e63r)",
      activeVerbsMeccan: "active verbs in Meccan surahs",
      conditionalsLate: "conditionals, after the first five surahs revealed",
      formFour: "Form IV imperfect verbs",
      jussive: "every jussive",
      indefiniteAccusative: "indefinite accusatives",
      secondFemininePlural: "2nd-person feminine plural imperfect verbs",
    },
    resultCount: (matches, verses) =>
      `${matches.toLocaleString()} ${matches === 1 ? "match" : "matches"} in ${verses.toLocaleString()} ${verses === 1 ? "verse" : "verses"}`,
    unexpectedError: "Something went wrong running that query.",
    scopeNote:
      "A query matches word positions drawn from three indices: rooted occurrences, segments carrying a syntactic or rhetorical tag, and segments carrying case, mood, definiteness or person\u2013gender\u2013number. A word in none of them \u2014 most pronouns, for one \u2014 is in neither index, so no query reaches it, and it never appears in a negated result either.",
  },
  phraseTextSearch: {
    label: "Phrase or sentence",
    search: "Search",
    helperText:
      'Matches the exact words in order (diacritics optional) — e.g. "يا أيها الذين آمنوا" finds every verse containing that literal phrase, not just verses that happen to share individual words with it.',
    noResults: (query) => `No verses found containing "${query}".`,
    matchCount: (count, cap) =>
      `${count.toLocaleString()} match${count === 1 ? "" : "es"}${count > cap ? ` (showing the first ${cap})` : ""}.`,
    copyThisPage: "Copy this page",
  },
  topicsPage: {
    title: "Browse by topic",
    subtitle:
      "A curated index from topic to the roots/lemmas that cover it -- hand-picked, not derived from any tafsir (classical commentary). Use it to find candidate verses quickly; it is not a claim about what a verse means, and a verse can be relevant to a topic without using any of the listed roots.",
    themes: "Themes",
    prophets: "Prophets",
    people: "People",
    species: "Plants & Animals",
    geography: "Geography",
    geology: "Geology",
    meteorology: "Sky & Weather",
    cosmology: "Cosmology",
    commodities: "Commodities",
    objects: "Named Objects",
    books: "Revealed Books",
    angels: "Angels",
    numbers: "Numbers",
    namesLink: "Names of Allah →",
    compareLink: "Compare topics side by side →",
  },
  topicPage: {
    prophetLabel: "Prophet",
    topicLabel: "Topic",
    personLabel: "Person",
    speciesLabel: "Plant / Animal",
    geographyLabel: "Geography",
    geologyLabel: "Geology",
    meteorologyLabel: "Sky & Weather",
    cosmologyLabel: "Cosmology",
    commoditiesLabel: "Commodity",
    objectLabel: "Object",
    bookLabel: "Revealed Book",
    angelLabel: "Angel",
    numberLabel: "Number",
    divineNameLabel: "Name of Allah",
    description: (count) =>
      `A curated root/lemma index, not derived from tafsir (classical commentary) -- a starting point for finding candidate verses, not a claim about what a verse means. ${count.toLocaleString()} verse${count === 1 ? "" : "s"} matched.`,
    noteLabel: "Note: ",
  },
  topicVerseList: {
    noMatches: "No verses matched this topic's roots/lemmas.",
    copyThisPage: "Copy this page",
  },
  printButton: {
    label: "Print / Save as PDF",
    printedFrom: (url) => `Printed from ${url}`,
    printedOn: (date) => `on ${date}`,
  },
  topicCompare: {
    title: "Compare topics",
    subtitle: "Pick a few topics to see their matched verses side by side.",
  },
  topicCompareView: {
    loadingTopics: "Loading topics…",
    pickAtLeastOneMore: "Pick at least one more topic to compare.",
    verseCount: (count) => `${count.toLocaleString()} verse${count === 1 ? "" : "s"}`,
  },
  topicPicker: {
    heading: "Topics to compare",
    subtitle: (max) => `Pick up to ${max} topics to compare side by side.`,
    removeAria: (label) => `Remove ${label}`,
    searchPlaceholder: "Search for a topic to add…",
  },
  namesPage: {
    title: "Names of Allah",
    subtitle:
      "The Qur'an's ninety-nine traditional names and attributes of Allah, as far as this corpus lets them be cleanly isolated -- plus how they pair up and which verses contain a curated set of Allah-invoking phrases.",
    tabNames: "Names",
    tabPairs: "Paired names",
    tabPhrases: "Phrases",
  },
  namePairsTab: {
    description:
      'Pairs of these names that occur as immediately adjacent words somewhere in the Qur\'an -- e.g. "العليم الحكيم" or "الرحمن الرحيم" -- found by matching each word\'s resolved root and lemma against the Names list itself, never by coincidental text. Recited Basmala headers preceding each surah aren\'t separate verses in this corpus, so they aren\'t counted here; only the six times "الرحمن الرحيم" occurs within a numbered verse are.',
    loading: "Loading pairs…",
    occurrencesCount: (n) => `${n.toLocaleString()} verse${n === 1 ? "" : "s"}`,
    noResults: "No pairs found.",
  },
  namePhrasesTab: {
    description:
      'Every verse containing one of these phrases anywhere in its text -- direct addresses to Allah, first/second-person references to Him as "Lord," and a run of preposition + Allah/"your Lord" combinations. A curated starting point you can add to, edit, or remove from -- changes are saved on this device only.',
    loading: "Loading verses…",
    versesCount: (n) => `${n.toLocaleString()} verse${n === 1 ? "" : "s"}`,
    noResults: "No verse contains this phrase.",
    pickPrompt: "Pick a phrase above to see every verse that contains it.",
    addPhrase: "+ Add phrase",
    editAria: (phrase) => `Edit ${phrase}`,
    removeAria: (phrase) => `Remove ${phrase}`,
    resetToDefaults: "Reset to defaults",
  },
  phraseForm: {
    phraseLabel: "Arabic phrase",
    phrasePlaceholder: "e.g. من ربكم",
    labelLabel: "English label",
    labelPlaceholder: "e.g. Min rabbikum (From your Lord)",
  },
  curiositiesPage: {
    title: "Curiosities",
    intro:
      "Patterns in the text that are interesting to look at but are not linguistic evidence. They live here rather than alongside the corpus statistics so that the difference is visible.",
    caveat:
      "Abjad assigns each Arabic letter a number and sums them. The arithmetic here is exact and reproducible; what it means is not a question arithmetic can answer. Nothing on this page is used by, or affects, any count elsewhere in this app.",
    backToInsights: "\u2190 Back to Insights",
    linkFromInsights: "Abjad numerology has moved to Curiosities",
  },
  versePage: {
    words: "Words",
    revelation: "Revealed",
    chronological: "Chronological order",
    juz: "Juz'",
    hizb: "\u1E24izb",
    surahLength: "Verses in surah",
  },
  lane: {
    heading: "Lane's Lexicon",
    loading: "Loading the lexicon\u2026",
    failed: "Could not load the lexicon.",
    underSpelling: "Lane files this root under",
    showAll: (n: number) => `Show all ${n} articles`,
    noEntry: (covered: number, total: number) =>
      `Lane has no article for this root. The lexicon covers ${covered.toLocaleString()} of this corpus's ${total.toLocaleString()} roots: Lane died in 1876 having published through roughly \u0642/\u0643, and the remainder was assembled from his notes and is much thinner. Nothing is shown from a similarly-spelled root, because a similar spelling is a different root.`,
    coverage: (covered: number, total: number) =>
      `Covers ${covered.toLocaleString()} of this corpus's ${total.toLocaleString()} roots.`,
    // Empty in English: the work is already in the reader's language, so
    // saying so would be noise.
    englishWork: "",
  },
  mujam: {
    heading: "Classical Arabic lexicons",
    loading: "Loading the lexicons\u2026",
    failed: "The lexicons could not be loaded.",
    underSpelling: "Listed under",
    noEntry: (covered, total) =>
      `None of the three lexicons has an article for this root. Together they cover ${covered.toLocaleString()} of ${total.toLocaleString()} roots.`,
    coverage: (covered, total) =>
      `Covers ${covered.toLocaleString()} of this corpus's ${total.toLocaleString()} roots.`,
  },
  tafsir: {
    toggle: "Commentary",
    loading: "Loading commentary\u2026",
    failed: "Could not load the commentary.",
    noEntry: (covered: number, total: number) =>
      `This commentary has no separate note on this verse. It treats ${covered.toLocaleString()} of the Qur'an's ${total.toLocaleString()} verses individually \u2014 verses it passes over are usually ones it has already glossed, such as a repeated refrain. Nothing is shown here rather than the nearest preceding note, which would not be a comment on this verse.`,
  },
  readings: {
    toggle: "Other transmissions",
    loading: "Loading transmissions\u2026",
    failed: "Could not load the transmissions.",
    hafsLabel: "\u1E24af\u0163 \u02BFan \u02BF\u0100\u1E63im",
    baseTextNote: "\u00B7 this app's base text",
    viaQari: (qari: string) => `\u00B7 from ${qari}`,
    scopeNote:
      "These are written texts, so they show wording (farsh) differences only. Most of what audibly distinguishes the readings \u2014 madd, im\u0101la, idgh\u0101m, sakt, treatment of hamza \u2014 is u\u1E63\u016Bl and is not visible here. Nothing on this panel is computed, diffed or highlighted.",
    numberingNote:
      "The source re-segments each transmission onto Kufan verse boundaries so they align one-to-one with this app's numbering. The wording is each transmission's own; the verse division is not. Verse counting is a separate tradition from the reading.",
  },
  syntaxPage: {
    heading: "Syntax & rhetoric",
    intro:
      "Every grammatical feature the corpus marks \u2014 what a word IS (verb aspect and Form, voice, mood, kind of noun, case, definiteness, person\u2013gender\u2013number) and what a word DOES (restriction, condition, circumstantial \u1E25\u0101l, prohibition, emphasis, passive voice and the rest). Every chip is a query, and the query it runs is shown, so any filter here can be carried to the query page and taken further.",
    totalSegments: (n: number) => `${n.toLocaleString()} tagged segments`,
    methodologyNote:
      "The function tags are not \u201Coccurrences\u201D in this app's usual sense. An occurrence is a segment carrying a root, and 15,413 of the 17,014 tagged segments here are rootless particles. They are a parallel layer, counted separately, and they never affect a root's totals.",
    positionNote:
      "Counts and results here are WORD POSITIONS, not segments. An Arabic word can be several segments \u2014 a prefixed l\u0101m of emphasis and the noun it attaches to are two \u2014 so a word carrying two tagged segments appears once. That is the same unit the query page uses, which is what lets one query combine a root with a grammatical feature.",
    passiveNote:
      "Passive voice is tagged in the syntactic layer rather than as a grammatical category, because voice is independent of aspect \u2014 a passive perfect verb is still a perfect verb, and is still counted as one everywhere else in this app.",
  },
  grammarPage: {
    groups: {
      verbs: "Verbs",
      nouns: "Nouns & adjectives",
      function: "Function & rhetoric",
    },
    sections: {
      aspect: "Aspect",
      verbForm: "Form",
      voice: "Voice",
      mood: "Mood",
      person: "Person, gender, number",
      agreement: "Gender & number",
      nounType: "Kind",
      case: "Case",
      definiteness: "Definiteness",
      allTags: "Every tagged function",
    },
    noneSelected: "Pick a feature above to see every place it occurs.",
    occurrencesIn: (facet: string) => `Every occurrence of: ${facet}`,
    loading: "Loading\u2026",
    failed: "This filter could not be run.",
    matchCount: (n: number) => `${n.toLocaleString()} word positions`,
    openInQuery: "Open this query in the query page",
  },
  insightsPage: {
    title: "Insights",
    subtitle:
      "Corpus-wide statistics and curiosities -- letter frequency across any scope, plus a set of facts computed once across the whole Qur'an that no single root or word page can answer on its own.",
    groups: {
      ask: "Ask",
      wordsTogether: "Words together",
      repetitionForm: "Repetition & form",
      sound: "Sound",
      facts: "Facts",
    },
    compare: {
      tab: "Compare",
      heading: "What is characteristic of this part of the Qur'an?",
      intro:
        "Pick a scope \u2014 a surah, a juz', the Meccan or Medinan corpus, a window of the revelation order \u2014 and every root is measured against the rest of the Qur'an. A count on its own cannot answer a research question, because the question is always \u201Ccompared to what\u201D.",
      scopeLabel: "Scope",
      scopeQuran: "Whole Qur'an",
      scopeMeccan: "Meccan",
      scopeMedinan: "Medinan",
      scopeSurah: "Surah",
      scopeJuz: "Juz'",
      scopeChrono: "Revelation order",
      juzLabel: (n: number) => `Juz' ${n}`,
      chronoTo: "to",
      chronoHint: "(position in revelation order, 1\u2013114)",
      minCount: "Minimum occurrences",
      showOver: "Over-used here",
      showUnder: "Under-used here",
      sortEven: "Most evenly spread",
      sortConcentrated: "Most concentrated",
      loading: "Loading the corpus\u2026",
      noRows: "No root meets the minimum-occurrence floor in this scope. Lower it to see more.",
      keynessHeadingOver: "Roots over-used here, against the rest of the Qur'an",
      keynessHeadingUnder: "Roots under-used here, against the rest of the Qur'an",
      dispersionHeading: "How evenly is each root spread across the Qur'an?",
      dispersionIntro:
        "At whole-Qur'an scope there is nothing to compare against, so the question changes: is a root part of the book's ordinary vocabulary, or concentrated in a few passages? DP is 0 when a root is spread exactly in proportion to how much text each surah holds, and approaches 1 as it piles into one place. The minimum-occurrence floor matters more here than anywhere: a root occurring five times never had the chance to spread, so it is \u201Cconcentrated\u201D only because it is rare.",
      summary: (verses: number, tokens: number, referenceTokens: number) =>
        `${verses.toLocaleString()} verses \u00b7 ${tokens.toLocaleString()} rooted occurrences here, against ${referenceTokens.toLocaleString()} elsewhere`,
      correctionNote: (tests: number, alpha: string) =>
        `${tests.toLocaleString()} roots were tested, so \u201Ccorrected\u201D marks the rows that survive a Bonferroni threshold of p < ${alpha}. At a plain p < 0.05, about ${Math.round(tests * 0.05).toLocaleString()} roots would clear the bar by chance alone.`,
      fdrCorrectionNote: (shown: number, alpha: string) =>
        `${shown.toLocaleString()} roots meet the minimum-occurrence floor above; among those, \u201Ccorrected\u201D marks the rows Benjamini-Hochberg FDR calls significant at p < ${alpha}. This is a different, smaller family than Bonferroni's (every root tested, floor or no floor) \u2014 FDR is applied only where the rate itself is estimated from enough occurrences to be worth defending, and has more power to find real, moderate effects than Bonferroni across a family this size.`,
      correctionMethodLabel: "Correction",
      correctionBonferroni: "Bonferroni",
      correctionFdr: "FDR (BH)",
      nsNote:
        "Rows marked n.s. are not statistically significant; they are shown because absence of evidence is a result too.",
      estimatedNote:
        "The root does not occur at all on one side, so a count of 0 was floored to 0.5 to keep the effect size finite (Hardie 2014). The significance measure uses the real counts.",
      openInQuery: "Open this row as a query",
      colRoot: "Root",
      colCount: "n",
      colHere: "per 10k here",
      colElsewhere: "per 10k elsewhere",
      colRateCIHint: "The smaller range underneath is the 95% Wilson score confidence interval.",
      colLogRatio: "Log ratio",
      colLogRatioCIHint:
        "The smaller range underneath is a 95% confidence interval on the log ratio itself (Katz et al. 1978), not the rate.",
      colG2: "G\u00b2",
      colSig: "Significance",
      colRange: "Surahs",
      colDp: "DP",
      colSpread: "Concentration",
      colSignificance: "Significance",
      colSignificanceHint:
        "A permutation test: how often placing this root's occurrences by chance, in proportion to each surah's size, produces a DP at least this high. Computed on demand, one root at a time.",
      testSignificance: "Test significance",
      testingSignificance: "Testing\u2026",
      significanceResult: (p: number, permutations: number) =>
        `p = ${p.toFixed(3)} (${permutations.toLocaleString()} permutations)`,
      sig: {
        corrected: "corrected",
        p001: "p < 0.001",
        p01: "p < 0.01",
        p05: "p < 0.05",
        ns: "n.s.",
      },
      methodsHeading: "How to read this",
      methodsBasis:
        "The unit is a rooted occurrence \u2014 a segment carrying a root, this app's definition of an occurrence throughout. Rates are per 10,000 rooted occurrences, computed on the same basis inside the scope and outside it. Particles and pronouns carry no root and are not counted on either side.",
      methodsG2:
        "G\u00b2 is log-likelihood (Dunning 1993): how surprising the difference is, given how much text is involved. It grows with the size of the corpus, so a large G\u00b2 on a tiny difference is real but may be uninteresting.",
      methodsLogRatio:
        "Log ratio (Hardie 2014) is the size of the difference, in doublings: +1 means twice as common here, +3 means eight times. It does not grow with corpus size, and it is unstable on small counts \u2014 which is what the minimum-occurrence floor is for. The smaller range underneath is a 95% confidence interval on that log ratio itself, via the delta-method standard error for a log relative risk (Katz, Baptista, Azen & Pike 1978) \u2014 the same method behind the risk-ratio interval in a meta-analysis forest plot \u2014 so a reader can see whether two effect sizes are actually distinguishable, not just compare their single best estimates.",
      methodsCI:
        "The smaller range under each rate is a 95% Wilson score confidence interval (Wilson 1927): where the true rate plausibly lies, not just its single best estimate. Preferred here over the textbook normal approximation because it stays inside 0-100% and keeps its stated coverage even at the small counts a keyness table often runs on.",
      methodsCorrection:
        "Bonferroni and FDR (Benjamini-Hochberg, 1995) answer different questions and are offered as alternatives, not as one right answer. Bonferroni bounds the chance of any false positive at all, across every root that occurs anywhere in the comparison \u2014 strict, and conservative enough to bury real, moderate effects among 1,651 simultaneous tests. FDR instead bounds the expected proportion of false positives among the rows it calls significant, computed only among the roots above the minimum-occurrence floor, and has more power to find those effects at some known cost in false discoveries.",
      methodsDp:
        "DP is Gries's deviation of proportions (2008): how far a root's distribution across the 114 surahs departs from what those surahs' sizes would predict. It separates a word used 300 times across eighty surahs from one used 300 times in a single passage \u2014 two facts this app previously reported identically.",
      methodsPermutation:
        "DP alone is descriptive, not a significance test: a root occurring only a handful of times can look concentrated by pure luck. \u201CTest significance\u201D runs a permutation (Monte Carlo) test for that one root: simulate its occurrences landing by chance, in proportion to each surah's size, many times over, and see how often that alone produces a DP as high as observed. A small p-value means the concentration is unlikely to be a coincidence of where a rare word happened to land.",
      methodsLimits:
        "The reference corpus is always the rest of the Qur'an, which is a small corpus by the standards of these measures: read a single row as a lead to follow, not a result to publish. Roots are the unit here; lemmas, grammatical features and collocation follow.",
    },
    tabFacts: "Facts",
    tabLetters: "Letter frequency",
    tabRhyme: "Rhyme patterns",
    tabCollocations: "Verb collocations",
    tabAbjad: "Abjad value",
    tabCooccurrence: "Root network",
    tabPatterns: "Patterns",
    tabFormulas: "Formulas",
    tabVerseSimilarity: "Similar verses",
    letterFrequencyHeading: "Letter frequency",
    letterFrequencyDescription:
      "How often each Arabic letter appears, diacritics stripped but letter variants (ة vs ه, ا vs أ/إ/آ/ٱ) kept distinct. Pick a scope below.",
    scopeAyah: "Ayah",
    scopeSurah: "Surah",
    scopeJuz: "Juz'",
    scopeQuran: "Entire Qur'an",
    surahLabel: "Surah",
    ayahLabel: "Ayah",
    juzLabel: "Juz'",
    loading: "Counting letters…",
    noLetters: "No letters to count for this selection.",
    factsHeading: "Interesting facts",
    factsDescription:
      "Computed once across the entire corpus at build time -- things no single root or word page can answer by itself.",
    surahCoverage: (surahCount, total) => `${surahCount} / ${total} surahs`,
    longestVerseLabel: "Longest verse",
    shortestVerseLabel: "Shortest verse",
    wordsCount: (n) => `${n.toLocaleString()} words`,
    longestWordLabel: "Longest word",
    lettersCount: (n) => `${n.toLocaleString()} letters`,
    mostFrequentLetterLabel: "Most frequent letter",
    leastFrequentLetterLabel: "Least frequent letter",
    hapaxRootsLabel: "Roots occurring exactly once",
    hapaxLemmasLabel: "Exact words occurring exactly once",
    hapaxViewHint: "Click to view the list →",
    hapaxFilterPlaceholder: "Filter…",
    hapaxNoMatch: (query) => `No match for "${query}".`,
    mostDerivedRootLabel: "Most derivationally rich root",
    lemmasCount: (n) => `${n.toLocaleString()} distinct lemmas`,
    mostFormsRootLabel: "Root with the most surface forms",
    formsCount: (n) => `${n.toLocaleString()} distinct forms`,
    mostRootDenseVerseLabel: "Most root-dense verse",
    rootsInVerseCount: (roots, words) => `${roots} distinct roots across ${words} words`,
    rhymeHeading: "Rhyme patterns (fawāṣil)",
    rhymeDescription:
      "Classical Qur'anic rhetorical studies (fawāṣil/sajʿ) classify verse-endings by their final letter. Click one to see the verses that end with it.",
    rhymeLoading: "Loading verse endings…",
    rhymePickPrompt: "Pick an ending letter above to see matching verses.",
    rhymeShowingCount: (shown, total) =>
      `Showing ${shown.toLocaleString()} of ${total.toLocaleString()} verses`,
    vocabHeading: "Distinctive vocabulary",
    vocabDescription:
      "Which roots are over-represented in one surah relative to their corpus-wide average rate -- what makes this surah's word choice distinct, not just what's common everywhere.",
    vocabSurahLabel: "Surah",
    vocabLoading: "Loading…",
    vocabRatio: (ratio) => `${ratio}× avg`,
    vocabOccurrences: (n) => `${n.toLocaleString()} occurrences in this surah`,
    vocabNoResults: "No root repeats often enough in this surah to rank (minimum 3 occurrences).",
    collocationsHeading: "Verb–preposition collocations",
    collocationsDescription:
      "Which preposition typically follows a given verb root's occurrences -- a real question in Arabic grammar (a verb's sense can shift with the preposition it takes, e.g. آمن بـ vs آمن لـ).",
    collocationsRootPlaceholder: "Type a verb root…",
    collocationsLoading: "Loading…",
    collocationsNoResults:
      "This root was never immediately followed by one of the tracked prepositions.",
    collocationsPickPrompt:
      "Pick a root above to see which prepositions follow its verb occurrences.",
    scopedPmiNote:
      "PMI is measured over the whole Qur'an and does not change with the scope above; the count and ranking below do.",
    abjadHeading: "Abjad value (ḥisāb al-jummal)",
    abjadDescription:
      "The ancient Arabic letter-numeral system (أبجد هوز حطي...) used historically for chronograms and numerology. Every letter carries a fixed value; a word, verse, or larger passage's value is the sum of its letters.",
    abjadReferenceHeading: "Letter values",
    abjadLoading: "Loading…",
    scopeHizb: "Hizb",
    hizbLabel: "Hizb",
    abjadTotalLabel: "Total value",
    abjadWordBreakdownHeading: "Per word",
    abjadLookupHeading: "Find by value",
    abjadLookupDescription:
      "The classical chronogram tradition works in reverse: a target number, matched against a text's Abjad value. Enter a number to find every verse or whole surah whose total equals it exactly.",
    abjadLookupPlaceholder: "e.g. 786",
    abjadLookupInvalid: "Enter a positive whole number.",
    abjadLookupSurahsFound: (n) =>
      `${n.toLocaleString()} whole surah${n === 1 ? "" : "s"} match exactly`,
    abjadLookupVersesFound: (shown, total) =>
      `${total.toLocaleString()} verse${total === 1 ? "" : "s"} match exactly${total > shown ? ` (showing ${shown})` : ""}`,
    abjadLookupNoVerses: "No verse matches that value exactly.",
    abjadLookupWordsFound: (n) =>
      `${n.toLocaleString()} distinct word form${n === 1 ? "" : "s"} match exactly`,
    abjadCommonValuesHeading: "Common values",
    abjadCommonValuesDescription:
      "Numerical values shared by more than one verse, surah, or exact word form -- pick one to see everything that matches it.",
    abjadCommonValuesVerses: (n) => `${n.toLocaleString()} verse${n === 1 ? "" : "s"}`,
    abjadCommonValuesSurahs: (n) => `${n.toLocaleString()} surah${n === 1 ? "" : "s"}`,
    abjadCommonValuesWords: (n) => `${n.toLocaleString()} word${n === 1 ? "" : "s"}`,
    abjadCommonValuesShowingTop: (shown, total) =>
      `Showing the ${shown.toLocaleString()} most shared of ${total.toLocaleString()} values`,
    abjadCommonValuesEmpty: "No value is shared by more than one verse, surah, or word yet.",
    cooccurrenceHeading: "Root co-occurrence network",
    cooccurrenceDescription:
      "Which pairs of roots occur together in the same verse most often, across the whole Qur'an -- unlike Collocations (what else appears in one root's own verses), this surfaces the most formulaic/idiomatic pairings corpus-wide. Pairs sharing fewer than 3 verses are excluded as noise.",
    cooccurrenceTopPairsHeading: "Most frequent pairs",
    cooccurrenceRootPlaceholder: "Type a root to see its top co-occurring partners…",
    cooccurrenceLoading: "Loading…",
    cooccurrenceNoResults: "This root shares fewer than 3 verses with any other root.",
    cooccurrencePickPrompt: "Pick a root above to see which other roots co-occur with it most.",
    cooccurrenceSharedVerses: (n) => `${n.toLocaleString()} shared verses`,
    patternsHeading: "Morphological patterns",
    patternsDescription:
      "How productive each verb Form, derivational category, and root shape is across the whole corpus -- a cross-root view of which grammatical patterns are common or rare, distinct from any single root's own forms table.",
    patternsVerbFormsHeading: "Verb Form productivity (I–XI)",
    patternsVerbFormsDescription:
      "How often each of the classical verb Forms is attested (an untagged verb counts as Form I), and how many distinct roots and root-lemma pairs produce it.",
    patternsCategoriesHeading: "Derivational category distribution",
    patternsCategoriesDescription:
      "How often each grammatical category occurs across the whole Qur'an, and how many distinct roots produce it.",
    patternsRootShapesHeading: "Root shape distribution",
    patternsRootShapesDescription:
      "How the corpus's roots (and their occurrences) split across the seven classical root shapes -- sound, hollow, defective, assimilated, geminate, hamzated, and quadriliteral.",
    patternsLoading: "Loading patterns…",
    patternsRootsCount: (n) => `${n.toLocaleString()} root${n === 1 ? "" : "s"}`,
    patternsLemmasCount: (n) => `${n.toLocaleString()} root-lemma pair${n === 1 ? "" : "s"}`,
    patternsDrilldownHint: "Click a bar to see its matching occurrences in Advanced Search.",
    patternsShapeRootsShown: (shown, total) =>
      `Showing ${shown.toLocaleString()} of ${total.toLocaleString()} roots, by occurrence count`,
    formulasHeading: "Recurring phrases (formulas)",
    formulasDescription:
      "Word sequences that recur often enough, in exactly the same words, to be candidate fixed expressions -- classical Qur'anic rhetorical studies call this takrar (repetition). Sliding windows of 3-6 consecutive words within a single verse, never crossing a verse boundary; shorter phrases need a higher repeat count to qualify, since they recur more often by grammatical chance alone.",
    formulasWordsLength: (n) => `${n} words`,
    formulasLoading: "Loading phrases…",
    formulasNoResults: "No phrase of this length recurs often enough to qualify.",
    formulasOccurrencesCount: (n) => `${n.toLocaleString()} occurrences`,
    formulasScopedNote:
      "This list is fixed to the whole Qur'an's top 25 phrases of this length; the count and ranking below reflect your chosen scope, but a phrase common only within it won't appear unless it also ranks among the whole Qur'an's top 25.",
    verseSimilarityHeading: "Similar verses",
    verseSimilarityDescription:
      "Verse pairs sharing an unusually high proportion of their distinct roots, even when the exact wording differs -- unlike Formulas (exact repeated phrases), this catches thematically or structurally parallel verses, like a repeated list or a shared narrative pattern across different stories.",
    verseSimilarityLoading: "Loading…",
    verseSimilaritySharedRoots: (n) => `${n} shared roots`,
    verseSimilarityJaccard: (pct) => `${pct}% overlap`,
    verseSimilarityPickPrompt: "Pick a pair above to compare the two verses.",
    verseSimilarityModeBoth: "Both verses in scope",
    verseSimilarityModeEither: "Either verse in scope",
    verseSimilarityModeHint:
      '"Both" finds a passage echoing itself; "either" finds this scope\'s echoes anywhere else in the Qur\'an.',
    verseSimilarityNoResults: "No pair meets the similarity floor under this scope and mode.",
    sortByFrequency: "Frequency",
    sortByPmi: "Statistical strength (PMI)",
    pmiExplanation:
      "PMI measures how much more (or less) than chance two things co-occur, correcting for how common each is by itself -- unlike raw frequency, it isn't biased toward simply-common items.",
    pmiLabel: (value) => `PMI ${value}`,
    collocationSigExplanation:
      "The smaller figure underneath is a Benjamini-Hochberg FDR q-value, from a G² test of the same association (Dunning 1993, the original collocation-significance test): whether this pairing is likely a real association or could be chance, corrected across every verb+preposition combination tracked.",
    collocationSigLabel: (q) => `q ${q < 0.001 ? "< 0.001" : q.toFixed(3)}`,
  },
  formulaDetailPage: {
    backToInsights: "← Back to Insights",
    summary: (length, count) =>
      `A ${length}-word phrase, occurring ${count.toLocaleString()} time${count === 1 ? "" : "s"} across the Qur'an.`,
  },
  surahInsights: {
    heading: "This surah at a glance",
    distinctiveVocabHeading: "Distinctive vocabulary",
    distinctiveVocabEmpty: "No root repeats often enough in this surah to rank.",
    rhymeHeading: "Predominant verse-ending",
    rhymeSummary: (count, total) => `${count.toLocaleString()} of ${total.toLocaleString()} verses`,
    rhymeEmpty: "No verses to analyze.",
    abjadHeading: "Abjad total (ḥisāb al-jummal)",
    abjadValue: (n) => n.toLocaleString(),
    viewMoreInInsights: "More corpus-wide research tools in Insights →",
  },
  surahPage: {
    readingNote: (transmission: string, numbering: string) =>
      `Text: ${transmission} \u00B7 ${numbering} numbering`,
    previous: "Previous",
    next: "Next",
    meccan: "Meccan",
    medinan: "Medinan",
    summary: (n, typeLabel, verses) =>
      `Surah ${n} · ${typeLabel} · ${verses.toLocaleString()} verses`,
  },
  interlinearToggle: {
    show: "Show interlinear gloss",
    hide: "Hide interlinear gloss",
  },
  ayahExplorer: {
    loadingOccurrences: "Loading occurrences…",
    heading: "Contextual Ayah Explorer",
    cardsView: "Cards",
    kwicView: "KWIC",
  },
  filterBar: {
    allCategories: "All categories",
    allLemmas: "All lemmas",
    allSurahs: "All surahs",
    clearFilters: "Clear filters",
    occurrencesCount: (count) => `${count.toLocaleString()} occurrences`,
  },
  pagination: {
    prev: "Prev",
    next: "Next",
    pageOf: (page, count) => `Page ${page} of ${count}`,
  },
  relatedVerses: {
    heading: "Related verses",
    none: "No closely related verses found.",
    sharedCount: (count) => `· ${count} shared`,
  },
  ayahActions: {
    copyArabic: "Copy Arabic",
    copyWithTranslation: "Copy with translation",
    openInSurah: "Open in surah",
  },
  ayahCard: {
    pickthallLabel: "Pickthall: ",
  },
  wordInfoPanel: {
    loading: "Looking up this word…",
    tapHint: "Tap any word for its root, grammar, lexicons and how characteristic it is here.",
    notRooted:
      "This is a particle, pronoun, or grammatical clitic -- it carries no root in this corpus.",
    root: "Root",
    lemma: "Lemma",
    category: "Category",
    grammar: "Grammar",
    features: "Inflection",
    segmentLabel: (g: number) => `segment ${g}`,
    caseLabel: "case",
    moodLabel: "mood",
    definitenessLabel: "definiteness",
    agreementLabel: "agreement",
    lexicons: "In the lexicons",
    lexiconMore: "read the full entry",
    keynessHeading: "In this surah",
    keynessOver: (times: string, g2: string) =>
      `${times}\u00d7 more frequent here than in the rest of the Qur'an (G\u00b2 ${g2})`,
    keynessUnder: (times: string, g2: string) =>
      `${times}\u00d7 less frequent here than in the rest of the Qur'an (G\u00b2 ${g2})`,
    keynessFlat: "About as frequent here as in the rest of the Qur'an",
    keynessNotSignificant: "not statistically significant",
    compareInInsights: "compare this surah",
    savedLabel: "Save this word",
    occurrencesOfRoot: (count) => `${count.toLocaleString()} occurrences of this root`,
    occurrencesOfLemma: (count) => `${count.toLocaleString()} occurrences of this lemma`,
    occurrencesOfForm: (count) => `${count.toLocaleString()} occurrences of this exact form`,
    viewRootPage: "View root page",
    viewWordPage: "View word page",
    close: "Close",
  },
  ayahMorphologyTable: {
    toggleShow: "Show full grammar breakdown",
    toggleHide: "Hide full grammar breakdown",
    loading: "Resolving every word…",
    wordColumn: "Word",
    rootColumn: "Root",
    lemmaColumn: "Lemma",
    categoryColumn: "Category",
    grammarColumn: "Grammar",
    notRooted: "Particle / pronoun / clitic -- no root",
  },
  exportMenu: {
    exportLabel: "Export:",
    csv: "CSV",
    json: "JSON",
    markdown: "Markdown",
    text: "Text",
  },
  copyTextButton: {
    defaultLabel: "Copy as Markdown",
    copied: "Copied",
  },
  saveButton: {
    save: "Save",
    saved: "Saved",
    removeAria: (label) => `Remove ${label} from saved`,
    saveAria: (label) => `Save ${label}`,
  },
  savedPage: {
    title: "Saved",
    subtitle:
      "Roots, words, and verses you've bookmarked, with room for your own notes. Stored only in this browser -- nothing is sent anywhere.",
  },
  savedList: {
    rootsHeading: "Roots",
    wordsHeading: "Words",
    versesHeading: "Verses",
    queriesHeading: "Queries",
    viewsHeading: "Views",
    exportAll: "Export notebook",
    importLabel: "Import",
    importSummary: (added: number, updated: number, skipped: number) =>
      `Imported: ${added} added, ${updated} updated, ${skipped} skipped.`,
    importFailed: "That file is not a notebook exported from this app.",
    empty:
      'Nothing saved yet. Use the "Save" button on a root, word, or verse page to bookmark it here.',
    removeAria: (label) => `Remove ${label}`,
    notePlaceholder: "Add a note…",
  },
  wordHeader: {
    lemmaLabel: "Lemma",
    rootPrefix: (root) => `root: ${root}`,
    occurrences: "Occurrences",
    surfaceForms: "Surface forms",
  },
  aboutPage: {
    title: "About",
    heading: "About this project",
    intro:
      "A free, open-source, account-less tool for researching Qur'anic Arabic roots and word forms. It runs entirely in your browser as a static site: no accounts, no login, no database server. All data ships as static files and works fully offline once installed.",
    readingHeading: "Which reading this is",
    readingBody: (transmission: string, edition: string, numbering: string) =>
      `The Arabic text throughout this app is ${transmission}, in the ${edition}, with ${numbering} verse numbering (6,236 verses).`,
    readingWhyItMatters:
      "This is stated because it is load-bearing, not as a footnote. A different canonical reading can put a word under a different root \u2014 at 2:259 this text reads \u0646\u064F\u0646\u0634\u0650\u0632\u064F (root \u0646\u0634\u0632), where another reads \u0646\u064F\u0646\u0634\u0650\u0631\u064F (root \u0646\u0634\u0631) \u2014 so every root count here is a count for this reading, and every surah:ayah:word reference is an address in this reading. Verse numbering is a separate tradition from the reading, and this app currently offers no others of either.",
    howCountsComputedHeading: "How counts are computed",
    howCountsComputedBody:
      'An "occurrence" of a root is a morphological segment tagged with that root in the underlying corpus. Particles, pronouns, and grammatical clitics (prefixes and suffixes such as the determiner "al-" or attached pronouns) never carry a root and are never counted toward one, even though they still appear in the verse text. This matches how the Quranic Arabic Corpus itself counts roots, which may differ from tools that count whole inflected words. Those uncounted particles are not discarded, though: the ones carrying a syntactic or rhetorical function \u2014 restriction, condition, circumstantial \u1E25\u0101l, prohibition, emphasis and the rest \u2014 are indexed separately and browsable under Syntax. That is a parallel layer with its own counts; it never changes a root\u2019s totals.',
    insightsMethodologyHeading: "How the Insights page's numbers are computed",
    insightsMethodologyIntro:
      "The Insights page (letter frequency, corpus facts, rhyme patterns, distinctive vocabulary, verb collocations, Abjad value) adds several metrics beyond simple occurrence counts. Each is documented here so a number can be cited and understood, not just displayed.",
    coverageRankingHeading: "Surah coverage rankings",
    coverageRankingBody:
      'The "which roots/words appear in the most surahs" lists rank by the number of distinct surahs a root or exact word (lemma) appears in -- not by raw frequency. A root can occur often while clustering in a handful of surahs, or rarely while spreading across nearly all of them; this ranks the latter kind of breadth. The top 15 are shown for each.',
    hapaxHeading: "Hapax legomena",
    hapaxBody:
      "A root or exact word occurring exactly once anywhere in the Qur'an -- a standard corpus-linguistics measure of vocabulary breadth, counted separately for roots and for exact words (lemmas), since a root can be a hapax while still having multiple surface forms, or vice versa.",
    rootDensityHeading: "Most root-dense verse",
    rootDensityBody:
      "Ranked by density -- distinct roots divided by word count -- among verses of at least 10 words, not by raw root count. Raw count would simply re-report whichever verse is longest (2:282, already shown separately as the longest verse); the 10-word minimum keeps a trivially short verse from topping the list by chance.",
    distinctiveVocabHeading: "Distinctive vocabulary",
    distinctiveVocabBody:
      "For each surah, ranks roots by how over-represented they are there compared to their rate across the whole Qur'an: (occurrences in this surah ÷ this surah's word count) divided by (occurrences overall ÷ the Qur'an's total word count). A root must occur at least 3 times within a surah to qualify -- without that floor, a root appearing just once in a short surah could trivially score as several times the corpus average purely from small numbers.",
    rhymeMethodHeading: "Rhyme patterns (fawāṣil)",
    rhymeMethodBody:
      "Each verse's \"ending\" is the final letter of its last word, diacritics stripped -- the unit classical Qur'anic rhetorical studies (fawāṣil/sajʿ) use to classify verse-endings. Letter variants (ة vs ه, alif forms) are not unified here, matching the letter-frequency table's convention.",
    collocationsMethodHeading: "Verb–preposition collocations",
    collocationsMethodBody:
      "For every occurrence of a verb root, checks whether the immediately following word -- or, for a one-letter proclitic like بِ/لِ/كَ, that word's attached prefix segment -- is one of ten canonical Arabic prepositions (ب ل ك من إلى على في عن مع حتى). Restricted to this list rather than any following particle, so the result reflects verb government (valency) specifically, not incidental adjacency to a conjunction, negation, or interrogative. Each combination also gets a PMI (pointwise mutual information) score alongside its raw count, measured over all tracked-verb occurrences with a following word: PMI asks whether a preposition follows a given verb more than its own overall frequency in that space would predict, so it isn't dominated by simply-common prepositions the way raw count is. Alongside PMI, a G² test of the same 2x2 co-occurrence table (Dunning 1993 -- the original collocation-significance test, as distinct from the two-corpus adaptation Compare uses) gives each combination a p-value, corrected to a Benjamini-Hochberg FDR q-value across every combination tracked: a high PMI on a handful of occurrences can be chance, and the q-value says how likely that is.",
    abjadMethodHeading: "Abjad value (ḥisāb al-jummal)",
    abjadMethodBody:
      "Sums each letter's value in the classical 28-letter Arabic numeral system (أبجد هوز حطي...), after stripping diacritics and folding alif variants and hamza carriers (أ إ آ ٱ ء ؤ ئ) to ا, teh marbuta (ة) to ه, and alif maksura (ى) to ي -- hamza carries no separate value in this system, which predates hamza as a distinct letter. The \"Find by value\" search reverses this: every verse's and every surah's own total is precomputed once at build time, so a target number can be matched against the whole corpus (an exact-equality scan) instead of one hand-picked phrase, the way classical chronogram composition itself works.",
    juzHizbHeading: "Juz' and Hizb boundaries",
    juzHizbBody:
      "The 30-part Juz' and 60-part Hizb divisions are standard structural divisions of the Mushaf, unrelated to the morphology dataset above. Boundaries were cross-checked against two independent community-maintained datasets (see the project's source code for exact references and commit history); that check found and corrected two isolated errors in one source's Hizb boundaries before they shipped.",
    cooccurrenceMethodHeading: "Root co-occurrence network",
    cooccurrenceMethodBody:
      "For every verse, collects its distinct rooted-word roots, then tallies every unordered pair of roots that share at least one verse, across the whole Qur'an -- unlike the per-root Collocations feature (what else appears in one root's own verses), this ranks pairs corpus-wide. A pair sharing fewer than 3 verses is excluded as noise; the top 50 pairs overall and each root's top 5 partners are shown. Raw count is biased toward simply-frequent roots (two very common roots will co-occur often just because each is everywhere), so every pair also gets a PMI (pointwise mutual information) score, using each root's own corpus-wide verse frequency as its baseline -- a positive PMI means the pair co-occurs more than that baseline predicts, surfacing distinctive pairings a count-only ranking would miss, including rare-but-tightly-bound ones.",
    patternsMethodHeading: "Morphological patterns",
    patternsMethodBody:
      "Every rooted segment is classified by verb Form (I-XI; an untagged verb defaults to Form I, matching the per-root Conjugation table's convention), by the same derivational category used everywhere else in this app, and by root shape (sound, hollow, defective, assimilated, geminate, hamzated, quadriliteral -- see the Roots browse page's \"by shape\" grouping). Each is then tallied across every root in the corpus, giving occurrence and distinct-root counts per Form/category/shape -- a cross-root productivity view, not a per-root breakdown.",
    formulasMethodHeading: "Recurring phrases (formulas)",
    formulasMethodBody:
      "For every verse, every contiguous run of 3, 4, 5, and 6 words (a sliding window, never crossing into the next verse) is normalized and counted across the whole Qur'an; each length is ranked independently, so a 3-word phrase and the 4-word phrase containing it appear as separate entries. Shorter phrases need more repeats to qualify (minimums of 6/4/3/3 occurrences for lengths 3-6) since short sequences recur more often by grammatical chance alone; the top 25 phrases per length are shown, each linking to a page listing every one of its occurrences with full verse text.",
    verseSimilarityMethodHeading: "Similar verses",
    verseSimilarityMethodBody:
      "For every verse, collects its distinct rooted-word roots. Candidate pairs are proposed only through roots occurring in 60 or fewer verses (a shared common root like أله is not a meaningful signal on its own), then every candidate is scored by full Jaccard similarity (shared roots ÷ the union of both verses' distinct roots) over each verse's complete root set. A pair needs at least 4 shared roots and 40% overlap to qualify; every pair clearing that bar is shown (around a thousand), not just a fixed top slice -- over 40% of them are a perfect (100%) match. This heuristic can miss a genuinely similar pair that shares only common roots -- it trades completeness for keeping the comparison corpus-wide rather than one hand-picked pair at a time.",
    keynessMethodHeading: "Compare (keyness)",
    keynessMethodBody:
      "Measures whether a root is characteristic of a chosen scope (a surah, a juz', the Meccan or Medinan corpus, a window of revelation order) against the rest of the Qur'an: log-likelihood G² (Dunning 1993) for statistical significance, log ratio (Hardie 2014) for effect size, and a 95% Wilson score confidence interval (Wilson 1927) on each rate. Testing every root at once needs a multiple-comparison correction; the tool offers a choice of Bonferroni (bounds the chance of any false positive at all, conservative) or Benjamini-Hochberg FDR (1995) (bounds the expected proportion of false positives among the rows called significant, more power). See the tool's own \"How to read this\" section for the full method and its stated limits.",
    dispersionMethodHeading: "Dispersion",
    dispersionMethodBody:
      "At whole-Qur'an scope, Compare reports dispersion instead of keyness: Gries's DP (2008), how far a root's spread across the 114 surahs departs from what those surahs' sizes would predict -- a root used 300 times across eighty surahs and one used 300 times in a single passage are not the same fact, though a raw count treats them identically. Since DP alone is descriptive, an on-demand permutation (Monte Carlo) test is available per root: it simulates the null (occurrences landing by chance, in proportion to each surah's size) many times over and reports how often that alone reaches a DP as high as observed.",
    letterFrequencyMethodHeading: "Letter frequency",
    letterFrequencyMethodBody:
      "Counts every Arabic letter in the chosen scope's text, diacritics stripped but letter variants (ة vs ه, ا vs أ/إ/آ/ٱ) kept distinct, read from the same canonical quran-json spelling every verse page displays -- the same text a scoped comparison, a juz', or a single ayah's count is computed from.",
    changelogHeading: "Data revisions",
    changelogIntro:
      "A number cited from a specific archived version should stay reproducible against that version forever -- so real corrections to the underlying data are recorded here, not silently absorbed into the next release. See \"Cite this tool\" above for which version DOI a given number belongs to.",
    changelogUnreleasedLabel: "Unreleased (since v1.0.0)",
    changelogCategoryFix:
      "Fixed occurrence categorization: occurrences.json's per-occurrence category now comes from that occurrence's own tags, not its word-form's -- a homograph (the same spelled word used differently on different occasions) could carry the wrong category before. This moves occurrences.json's category counts and Advanced Search's category/verb-Form filter results; every count that doesn't depend on category (total occurrences, verb-Form counts, case/mood/definiteness/syntax-tag counts) is unchanged.",
    changelogLetterFrequencyFix:
      "Fixed a text-source mismatch: the whole-Qur'an letter frequency count and the \"longest word\" fact now read the same canonical spelling every verse page displays, instead of the morphology corpus's own word reconstruction -- which used a different spelling convention (word-final ي vs ى, and a decomposed vs precomposed hamza) for roughly half of all words at the diacritics-stripped level. Moved the total letter count by about 0.09%.",
    changelogStatsAdditions:
      "Added 95% Wilson score confidence intervals, a Benjamini-Hochberg FDR option alongside Bonferroni, and an on-demand permutation significance test for dispersion to the Compare tool.",
    changelogV1Label: "v1.0.0 (20 September 2026)",
    changelogV1Note: "First archived release.",
    dataSourcesHeading: "Data sources & licenses",
    laneLexiconNote:
      "Root meanings are given as \"after Lane's Lexicon\" -- a summary drawn from that dataset, not a verbatim quotation of the original 19th-century lexicon. This project's own source code is licensed GPL-3.0, matching the copyleft terms of the morphology dataset it builds on.",
    offlineHeading: "Offline & installation",
    offlineBody:
      'On a phone or desktop browser that supports it, use "Add to Home Screen" (or the install prompt this site shows after a couple of visits) to install it like a native app. Once installed, previously visited roots and surahs stay available offline, and the app can download the full corpus in the background for complete offline access.',
    downloaded: "Downloaded for offline use.",
    downloading: (pct) => `Downloading… ${pct}%`,
    downloadEverything: "Download everything for offline use",
    dataBuildHeading: "Data build",
    citeHeading: "Citing this",
    citeIntro: "Archived on Zenodo, so a reference to this tool survives the URL changing.",
    citeConceptLabel: "All versions",
    citeVersionLabel: "This release",
    citeWhyVersion:
      "Cite the release, not \u201call versions\u201d, when a number has to be checkable: every count here is computed against one reading of the text and one corpus build, and \u201call versions\u201d will resolve to a later build than the one you read.",
    citeButtonHint:
      "The Cite button on any root or word page already emits this, together with the dataset hash and the reading.",
    dataBuildSummary: (date, words, roots, occurrences, verses) =>
      `Built ${date} · ${words.toLocaleString()} words · ${roots.toLocaleString()} roots · ${occurrences.toLocaleString()} root occurrences across ${verses.toLocaleString()} verses.`,
    corpusExportHeading: "Bulk corpus export",
    corpusExportBody:
      "Every word of the Qur'an in one CSV file -- surah, ayah, word, root, lemma, grammatical category, tags, and both English translations -- for analysis in Excel, pandas, R, or any other tool outside this app. This is the same data every page here is built from, unfiltered.",
    corpusExportDownload: (size) => `Download full corpus (CSV, ${size})`,
    corpusExportReleases: "Browse releases",
    corpusExportNotPublished: (size) =>
      `The export is ${size} \u2014 too large to ship with the site, so it is published as a release asset rather than served from here. Build it yourself with \`pnpm data:build\`; it lands in \`dist/export/corpus.csv\`.`,
    codebookBody:
      "A machine-readable data dictionary for this CSV's columns \u2014 name, type, nullability, and every enum's possible values \u2014 plus an index of the JSON files under data/v1 this app itself (and the command-line tool below) reads:",
    qcqlCliHeading: "Command-line queries",
    qcqlCliBody:
      "The same query language the Query page runs in your browser is also available as a script, for anyone who wants to run many queries, batch results into a file, or pull matches into a notebook rather than clicking through a page one query at a time. In a checkout that has run the data build, `npm run qcql -- \"[root=\\u0639\\u0644\\u0645 & cat=verb.perf] :: meccan\"` prints CSV to stdout; add `--format json`, `--with-text`, or `--base-url` to read a deployed instance's data instead of a local build. Run `npm run qcql -- --help` for the full option list.",
  },
};
