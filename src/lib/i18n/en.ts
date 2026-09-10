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
  },
};
