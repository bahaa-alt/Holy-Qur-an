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
    compare: "Compare",
    search: "Search",
    phrases: "Phrases",
    topics: "Topics",
    insights: "Insights",
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
  quran: {
    title: "The Qur'an",
    subtitle: "All 114 surahs, in mus'haf order. Open any surah to read the full Uthmani text with translation, word by word.",
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
    heading: "Verb conjugation",
    subtitle: "Attested forms by verb Form, aspect, and person/gender/number. Click a form to filter the explorer below.",
    form: (verbForm) => `Form ${verbForm}`,
    occurrencesCount: (count) => `${count.toLocaleString()} occurrences`,
  },
  surahDistribution: {
    heading: "Distribution across surahs",
    surahOrder: "Surah order",
    revelationOrder: "Revelation order",
    bySurahDescription: "Where this root's occurrences fall across the 114 surahs.",
    byRevelationDescription: "The same occurrences, ordered by the conventional chronological (revelation) sequence instead.",
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
    subtitle: "Pick up to three roots to compare their occurrence counts and category breakdowns side by side.",
  },
  compareView: {
    loadingRoots: "Loading roots…",
    pickAtLeastOneMore: "Pick at least one more root to compare.",
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
  searchPage: {
    title: "Phrase & sentence search",
    subtitle:
      'Find every verse containing an exact phrase or sentence -- common openings like "يا أيها الناس" or "يا أيها الذين آمنوا", or any run of words you type. For matching root pairs regardless of the exact words used, see',
    phrasesLinkLabel: "Phrases",
    subtitleAfterLink: "instead.",
    advancedSearchLinkLabel: "Looking for a grammatical pattern instead? Try Advanced Search →",
  },
  advancedSearchPage: {
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
  },
  topicPage: {
    prophetLabel: "Prophet",
    topicLabel: "Topic",
    description: (count) =>
      `A curated root/lemma index, not derived from tafsir (classical commentary) -- a starting point for finding candidate verses, not a claim about what a verse means. ${count.toLocaleString()} verse${count === 1 ? "" : "s"} matched.`,
    noteLabel: "Note: ",
  },
  topicVerseList: {
    noMatches: "No verses matched this topic's roots/lemmas.",
    copyThisPage: "Copy this page",
  },
  insightsPage: {
    title: "Insights",
    subtitle:
      "Corpus-wide statistics and curiosities -- letter frequency across any scope, plus a set of facts computed once across the whole Qur'an that no single root or word page can answer on its own.",
    tabFacts: "Facts",
    tabLetters: "Letter frequency",
    tabCoverage: "Vocabulary coverage",
    tabRhyme: "Rhyme patterns",
    tabVocabulary: "Distinctive vocabulary",
    tabCollocations: "Verb collocations",
    tabAbjad: "Abjad value",
    tabCooccurrence: "Root network",
    tabPatterns: "Patterns",
    tabFormulas: "Formulas",
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
    rootsCoverageHeading: "Roots by how many surahs they appear in",
    rootsCoverageDescription:
      "Ranked by distinct-surah coverage, not raw frequency -- a root can occur often while clustering in a few surahs, or rarely while spreading everywhere.",
    lemmasCoverageHeading: "Words by how many surahs they appear in",
    lemmasCoverageDescription: "Same ranking, one level more specific: exact words (lemmas), rooted or not.",
    surahCoverage: (surahCount, total) => `${surahCount} / ${total} surahs`,
    everySurahBadge: "Every surah",
    longestVerseLabel: "Longest verse",
    shortestVerseLabel: "Shortest verse",
    wordsCount: (n) => `${n.toLocaleString()} words`,
    longestWordLabel: "Longest word",
    lettersCount: (n) => `${n.toLocaleString()} letters`,
    mostFrequentLetterLabel: "Most frequent letter",
    leastFrequentLetterLabel: "Least frequent letter",
    hapaxRootsLabel: "Roots occurring exactly once",
    hapaxLemmasLabel: "Exact words occurring exactly once",
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
    rhymeShowingCount: (shown, total) => `Showing ${shown.toLocaleString()} of ${total.toLocaleString()} verses`,
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
    collocationsNoResults: "This root was never immediately followed by one of the tracked prepositions.",
    collocationsPickPrompt: "Pick a root above to see which prepositions follow its verb occurrences.",
    abjadHeading: "Abjad value (ḥisāb al-jummal)",
    abjadDescription:
      "The ancient Arabic letter-numeral system (أبجد هوز حطي...) used historically for chronograms and numerology. Every letter carries a fixed value; a word, verse, or larger passage's value is the sum of its letters.",
    abjadReferenceHeading: "Letter values",
    abjadLoading: "Loading…",
    scopeHizb: "Hizb",
    hizbLabel: "Hizb",
    abjadTotalLabel: "Total value",
    abjadWordBreakdownHeading: "Per word",
    cooccurrenceHeading: "Root co-occurrence network",
    cooccurrenceDescription:
      "Which pairs of roots occur together in the same verse most often, across the whole Qur'an -- unlike Collocations (what else appears in one root's own verses), this surfaces the most formulaic/idiomatic pairings corpus-wide. Pairs sharing fewer than 3 verses are excluded as noise.",
    cooccurrenceTopPairsHeading: "Most frequent pairs, corpus-wide",
    cooccurrenceRootPlaceholder: "Type a root to see its top co-occurring partners…",
    cooccurrenceLoading: "Loading…",
    cooccurrenceNoResults: "This root shares fewer than 3 verses with any other root.",
    cooccurrencePickPrompt: "Pick a root above to see which other roots co-occur with it most.",
    cooccurrenceSharedVerses: (n) => `${n.toLocaleString()} shared verses`,
    cooccurrenceGraphCaption:
      "The 24 most-connected roots among the top 50 pairs. Node size and line thickness both reflect co-occurrence count; hover a line for its exact count. Click a root to open it.",
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
    patternsShapeRootsShown: (shown, total) => `Showing ${shown.toLocaleString()} of ${total.toLocaleString()} roots, by occurrence count`,
    formulasHeading: "Recurring phrases (formulas)",
    formulasDescription:
      "Word sequences that recur often enough, in exactly the same words, to be candidate fixed expressions -- classical Qur'anic rhetorical studies call this takrar (repetition). Sliding windows of 3-6 consecutive words within a single verse, never crossing a verse boundary; shorter phrases need a higher repeat count to qualify, since they recur more often by grammatical chance alone.",
    formulasWordsLength: (n) => `${n} words`,
    formulasLoading: "Loading phrases…",
    formulasNoResults: "No phrase of this length recurs often enough to qualify.",
    formulasOccurrencesCount: (n) => `${n.toLocaleString()} occurrences`,
    sortByFrequency: "Frequency",
    sortByPmi: "Statistical strength (PMI)",
    pmiExplanation:
      "PMI measures how much more (or less) than chance two things co-occur, correcting for how common each is by itself -- unlike raw frequency, it isn't biased toward simply-common items.",
    pmiLabel: (value) => `PMI ${value}`,
  },
  formulaDetailPage: {
    backToInsights: "← Back to Insights",
    summary: (length, count) =>
      `A ${length}-word phrase, occurring ${count.toLocaleString()} time${count === 1 ? "" : "s"} across the Qur'an.`,
  },
  surahPage: {
    previous: "Previous",
    next: "Next",
    meccan: "Meccan",
    medinan: "Medinan",
    summary: (n, typeLabel, verses) => `Surah ${n} · ${typeLabel} · ${verses.toLocaleString()} verses`,
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
    notRooted: "This is a particle, pronoun, or grammatical clitic -- it carries no root in this corpus.",
    root: "Root",
    lemma: "Lemma",
    category: "Category",
    grammar: "Grammar",
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
    subtitle: "Roots, words, and verses you've bookmarked, with room for your own notes. Stored only in this browser -- nothing is sent anywhere.",
  },
  savedList: {
    rootsHeading: "Roots",
    wordsHeading: "Words",
    versesHeading: "Verses",
    empty: 'Nothing saved yet. Use the "Save" button on a root, word, or verse page to bookmark it here.',
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
    howCountsComputedHeading: "How counts are computed",
    howCountsComputedBody:
      'An "occurrence" of a root is a morphological segment tagged with that root in the underlying corpus. Particles, pronouns, and grammatical clitics (prefixes and suffixes such as the determiner "al-" or attached pronouns) never carry a root and are never counted toward one, even though they still appear in the verse text. This matches how the Quranic Arabic Corpus itself counts roots, which may differ from tools that count whole inflected words.',
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
      "For every occurrence of a verb root, checks whether the immediately following word -- or, for a one-letter proclitic like بِ/لِ/كَ, that word's attached prefix segment -- is one of ten canonical Arabic prepositions (ب ل ك من إلى على في عن مع حتى). Restricted to this list rather than any following particle, so the result reflects verb government (valency) specifically, not incidental adjacency to a conjunction, negation, or interrogative. Each combination also gets a PMI (pointwise mutual information) score alongside its raw count, measured over all tracked-verb occurrences with a following word: PMI asks whether a preposition follows a given verb more than its own overall frequency in that space would predict, so it isn't dominated by simply-common prepositions the way raw count is.",
    abjadMethodHeading: "Abjad value (ḥisāb al-jummal)",
    abjadMethodBody:
      "Sums each letter's value in the classical 28-letter Arabic numeral system (أبجد هوز حطي...), after stripping diacritics and folding alif variants and hamza carriers (أ إ آ ٱ ء ؤ ئ) to ا, teh marbuta (ة) to ه, and alif maksura (ى) to ي -- hamza carries no separate value in this system, which predates hamza as a distinct letter.",
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
      "For every verse, every contiguous run of 3, 4, 5, and 6 words (a sliding window, never crossing into the next verse) is normalized and counted across the whole Qur'an; each length is ranked independently, so a 3-word phrase and the 4-word phrase containing it appear as separate entries. Shorter phrases need more repeats to qualify (minimums of 6/4/3/3 occurrences for lengths 3-6) since short sequences recur more often by grammatical chance alone; the top 25 phrases per length are shown, each linking to up to 12 of its occurrences.",
    dataSourcesHeading: "Data sources & licenses",
    laneLexiconNote:
      'Root meanings are given as "after Lane\'s Lexicon" -- a summary drawn from that dataset, not a verbatim quotation of the original 19th-century lexicon. This project\'s own source code is licensed GPL-3.0, matching the copyleft terms of the morphology dataset it builds on.',
    offlineHeading: "Offline & installation",
    offlineBody:
      'On a phone or desktop browser that supports it, use "Add to Home Screen" (or the install prompt this site shows after a couple of visits) to install it like a native app. Once installed, previously visited roots and surahs stay available offline, and the app can download the full corpus in the background for complete offline access.',
    downloaded: "Downloaded for offline use.",
    downloading: (pct) => `Downloading… ${pct}%`,
    downloadEverything: "Download everything for offline use",
    dataBuildHeading: "Data build",
    dataBuildSummary: (date, words, roots, occurrences, verses) =>
      `Built ${date} · ${words.toLocaleString()} words · ${roots.toLocaleString()} roots · ${occurrences.toLocaleString()} root occurrences across ${verses.toLocaleString()} verses.`,
    corpusExportHeading: "Bulk corpus export",
    corpusExportBody:
      "Every word of the Qur'an in one CSV file -- surah, ayah, word, root, lemma, grammatical category, tags, and both English translations -- for analysis in Excel, pandas, R, or any other tool outside this app. This is the same data every page here is built from, unfiltered.",
    corpusExportDownload: (size) => `Download full corpus (CSV, ${size})`,
  },
};
