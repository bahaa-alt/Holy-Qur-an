import type { Cat } from "@/lib/data/types";
import type { RootShape } from "@/lib/morphology/rootShape";

/**
 * The full shape of a UI translation dictionary. `en.ts` is the canonical
 * definition (authored first, matches the strings the app shipped with
 * before this toggle existed); `ar.ts` is typed against this same shape so
 * a missing or misspelled key fails at compile time instead of silently
 * falling back to English at runtime.
 *
 * Parameterized entries are functions, not template strings, so the
 * calling component supplies already-formatted (toLocaleString()'d, etc.)
 * values and each language can order/pluralize its interpolation however
 * its grammar needs -- Arabic's dual/plural rules don't map onto the
 * English `n === 1 ? "" : "s"` pattern used for these before.
 */
export interface Dict {
  common: {
    search: string;
    copy: string;
    copied: string;
    save: string;
    saved: string;
    cancel: string;
    loading: string;
    loadingVerses: string;
    clearFilters: string;
    prev: string;
    next: string;
  };
  categories: Record<Cat, string>;
  rootShapes: Record<RootShape, string>;
  nav: {
    logoFull: string;
    logoShort: string;
    quran: string;
    roots: string;
    search: string;
    topics: string;
    names: string;
    insights: string;
    saved: string;
    about: string;
  };
  footer: {
    tagline: string;
    dataAndLicenses: string;
    source: string;
  };
  notFound: {
    title: string;
    message: string;
    backToSearch: string;
  };
  themeToggle: {
    switchToLight: string;
    switchToDark: string;
  };
  languageToggle: {
    switchToArabic: string;
    switchToEnglish: string;
  };
  offlineBadge: {
    offlineMode: string;
  };
  serviceWorker: {
    updateAvailable: string;
  };
  installPrompt: {
    heading: string;
    body: string;
    install: string;
    notNow: string;
    dismissAria: string;
  };
  searchBox: {
    ariaLabel: string;
    placeholder: (example: string) => string;
  };
  suggestionList: {
    ariaLabel: string;
  };
  suggestionKind: {
    root: string;
    lemma: string;
    verse: string;
    search: string;
  };
  home: {
    title: string;
    subtitle: string;
    mostFrequentRoots: string;
    browseAllRoots: (count: number) => string;
  };
  dailyWidget: {
    rootHeading: string;
    verseHeading: string;
    viewRoot: string;
    viewVerse: string;
  };
  quran: {
    title: string;
    subtitle: string;
    filterPlaceholder: string;
    noMatch: (query: string) => string;
    meccan: string;
    medinan: string;
    versesCount: (count: number) => string;
  };
  roots: {
    title: string;
    subtitle: (count: number) => string;
  };
  rootsBrowser: {
    filterPlaceholder: string;
    byLetter: string;
    byShape: string;
    noMatch: (query: string) => string;
    rootsCount: (count: number) => string;
  };
  randomRootLink: {
    label: string;
  };
  rootHeader: {
    rootLabel: string;
    fullyMeccan: string;
    fullyMedinan: string;
    meccanPct: (pct: number) => string;
    meaningLabel: string;
    totalOccurrences: string;
    derivedLemmas: string;
    distinctForms: string;
    verses: string;
  };
  frequencyChart: {
    heading: string;
    byCategory: string;
    byLemma: string;
  };
  formsTable: {
    heading: string;
    subtitle: string;
    colForm: string;
    colLemma: string;
    colCategory: string;
    colCount: string;
  };
  conjugationTable: {
    heading: string;
    subtitle: string;
    form: (verbForm: string) => string;
    occurrencesCount: (count: number) => string;
  };
  surahDistribution: {
    heading: string;
    surahOrder: string;
    revelationOrder: string;
    bySurahDescription: string;
    byRevelationDescription: string;
  };
  collocations: {
    heading: string;
    description: string;
  };
  citeButton: {
    cite: string;
    copied: string;
  };
  compare: {
    title: string;
    subtitle: string;
  };
  compareView: {
    loadingRoots: string;
    pickAtLeastOneMore: string;
    heatmapHeading: string;
  };
  rootPicker: {
    heading: string;
    subtitle: (max: number) => string;
    removeAria: (root: string) => string;
    searchPlaceholder: string;
  };
  compareStatsTable: {
    heading: string;
    totalOccurrences: string;
    derivedLemmas: string;
    distinctForms: string;
    verses: string;
    surahs: string;
  };
  compareCategoryBars: {
    heading: string;
  };
  phrasesPage: {
    title: string;
    subtitle: string;
  };
  phraseSearch: {
    leadingRoot: string;
    followedBy: string;
    search: string;
    noResults: string;
    matchCount: (count: number, cap: number) => string;
  };
  rootSlotPicker: {
    clearAria: (label: string) => string;
    searchPlaceholder: string;
  };
  searchHub: {
    title: string;
    subtitle: string;
    tabSearch: string;
    tabPhrases: string;
    tabCompare: string;
    advancedSearchLinkLabel: string;
  };
  advancedSearchPage: {
    title: string;
    subtitle: string;
    loading: string;
    categoryLabel: string;
    verbFormLabel: string;
    rootLabel: string;
    rootPlaceholder: string;
    rootClear: (root: string) => string;
    surahRangeLabel: string;
    surahFromLabel: string;
    surahToLabel: string;
    revelationLabel: string;
    revelationAll: string;
    revelationMeccan: string;
    revelationMedinan: string;
    clearFilters: string;
    resultCount: (count: number) => string;
    noResults: string;
    pageOf: (page: number, total: number) => string;
    previousPage: string;
    nextPage: string;
    verbFormShort: (roman: string) => string;
  };
  phraseTextSearch: {
    label: string;
    search: string;
    helperText: string;
    noResults: (query: string) => string;
    matchCount: (count: number, cap: number) => string;
    copyThisPage: string;
  };
  topicsPage: {
    title: string;
    subtitle: string;
    themes: string;
    prophets: string;
    people: string;
    species: string;
    geography: string;
    geology: string;
    meteorology: string;
    cosmology: string;
    commodities: string;
    objects: string;
    books: string;
    angels: string;
    numbers: string;
    namesLink: string;
    compareLink: string;
  };
  topicPage: {
    prophetLabel: string;
    topicLabel: string;
    personLabel: string;
    speciesLabel: string;
    geographyLabel: string;
    geologyLabel: string;
    meteorologyLabel: string;
    cosmologyLabel: string;
    commoditiesLabel: string;
    objectLabel: string;
    bookLabel: string;
    angelLabel: string;
    numberLabel: string;
    divineNameLabel: string;
    description: (count: number) => string;
    noteLabel: string;
  };
  topicVerseList: {
    noMatches: string;
    copyThisPage: string;
  };
  printButton: {
    label: string;
    printedFrom: (url: string) => string;
    printedOn: (date: string) => string;
  };
  topicCompare: {
    title: string;
    subtitle: string;
  };
  topicCompareView: {
    loadingTopics: string;
    pickAtLeastOneMore: string;
    verseCount: (count: number) => string;
  };
  topicPicker: {
    heading: string;
    subtitle: (max: number) => string;
    removeAria: (label: string) => string;
    searchPlaceholder: string;
  };
  namesPage: {
    title: string;
    subtitle: string;
    tabNames: string;
    tabPairs: string;
    tabPhrases: string;
  };
  namePairsTab: {
    description: string;
    loading: string;
    occurrencesCount: (n: number) => string;
    noResults: string;
  };
  namePhrasesTab: {
    description: string;
    loading: string;
    versesCount: (n: number) => string;
    noResults: string;
    pickPrompt: string;
    addPhrase: string;
    editAria: (phrase: string) => string;
    removeAria: (phrase: string) => string;
    resetToDefaults: string;
  };
  phraseForm: {
    phraseLabel: string;
    phrasePlaceholder: string;
    labelLabel: string;
    labelPlaceholder: string;
  };
  insightsPage: {
    title: string;
    subtitle: string;
    tabFacts: string;
    tabLetters: string;
    tabCoverage: string;
    tabRhyme: string;
    tabVocabulary: string;
    tabCollocations: string;
    tabAbjad: string;
    tabCooccurrence: string;
    tabPatterns: string;
    tabFormulas: string;
    tabVerseSimilarity: string;
    letterFrequencyHeading: string;
    letterFrequencyDescription: string;
    scopeAyah: string;
    scopeSurah: string;
    scopeJuz: string;
    scopeQuran: string;
    surahLabel: string;
    ayahLabel: string;
    juzLabel: string;
    loading: string;
    noLetters: string;
    factsHeading: string;
    factsDescription: string;
    rootsCoverageHeading: string;
    rootsCoverageDescription: string;
    lemmasCoverageHeading: string;
    lemmasCoverageDescription: string;
    surahCoverage: (surahCount: number, total: number) => string;
    everySurahBadge: string;
    longestVerseLabel: string;
    shortestVerseLabel: string;
    wordsCount: (n: number) => string;
    longestWordLabel: string;
    lettersCount: (n: number) => string;
    mostFrequentLetterLabel: string;
    leastFrequentLetterLabel: string;
    hapaxRootsLabel: string;
    hapaxLemmasLabel: string;
    hapaxViewHint: string;
    hapaxFilterPlaceholder: string;
    hapaxNoMatch: (query: string) => string;
    mostDerivedRootLabel: string;
    lemmasCount: (n: number) => string;
    mostFormsRootLabel: string;
    formsCount: (n: number) => string;
    mostRootDenseVerseLabel: string;
    rootsInVerseCount: (roots: number, words: number) => string;
    rhymeHeading: string;
    rhymeDescription: string;
    rhymeLoading: string;
    rhymePickPrompt: string;
    rhymeShowingCount: (shown: number, total: number) => string;
    vocabHeading: string;
    vocabDescription: string;
    vocabSurahLabel: string;
    vocabLoading: string;
    vocabRatio: (ratio: string) => string;
    vocabOccurrences: (n: number) => string;
    vocabNoResults: string;
    collocationsHeading: string;
    collocationsDescription: string;
    collocationsRootPlaceholder: string;
    collocationsLoading: string;
    collocationsNoResults: string;
    collocationsPickPrompt: string;
    abjadHeading: string;
    abjadDescription: string;
    abjadReferenceHeading: string;
    abjadLoading: string;
    scopeHizb: string;
    hizbLabel: string;
    abjadTotalLabel: string;
    abjadWordBreakdownHeading: string;
    abjadLookupHeading: string;
    abjadLookupDescription: string;
    abjadLookupPlaceholder: string;
    abjadLookupInvalid: string;
    abjadLookupSurahsFound: (n: number) => string;
    abjadLookupVersesFound: (shown: number, total: number) => string;
    abjadLookupNoVerses: string;
    cooccurrenceHeading: string;
    cooccurrenceDescription: string;
    cooccurrenceTopPairsHeading: string;
    cooccurrenceRootPlaceholder: string;
    cooccurrenceLoading: string;
    cooccurrenceNoResults: string;
    cooccurrencePickPrompt: string;
    cooccurrenceSharedVerses: (n: number) => string;
    patternsHeading: string;
    patternsDescription: string;
    patternsVerbFormsHeading: string;
    patternsVerbFormsDescription: string;
    patternsCategoriesHeading: string;
    patternsCategoriesDescription: string;
    patternsRootShapesHeading: string;
    patternsRootShapesDescription: string;
    patternsLoading: string;
    patternsRootsCount: (n: number) => string;
    patternsLemmasCount: (n: number) => string;
    patternsDrilldownHint: string;
    patternsShapeRootsShown: (shown: number, total: number) => string;
    formulasHeading: string;
    formulasDescription: string;
    formulasWordsLength: (n: number) => string;
    formulasLoading: string;
    formulasNoResults: string;
    formulasOccurrencesCount: (n: number) => string;
    verseSimilarityHeading: string;
    verseSimilarityDescription: string;
    verseSimilarityLoading: string;
    verseSimilaritySharedRoots: (n: number) => string;
    verseSimilarityJaccard: (pct: number) => string;
    verseSimilarityPickPrompt: string;
    sortByFrequency: string;
    sortByPmi: string;
    pmiExplanation: string;
    pmiLabel: (value: string) => string;
  };
  formulaDetailPage: {
    backToInsights: string;
    summary: (length: number, count: number) => string;
  };
  surahInsights: {
    heading: string;
    distinctiveVocabHeading: string;
    distinctiveVocabEmpty: string;
    rhymeHeading: string;
    /** letter is rendered separately (isolated via <bdi>) to avoid bidi-reversing this otherwise-LTR sentence -- see the component */
    rhymeSummary: (count: number, total: number) => string;
    rhymeEmpty: string;
    abjadHeading: string;
    abjadValue: (n: number) => string;
    viewMoreInInsights: string;
  };
  surahPage: {
    previous: string;
    next: string;
    meccan: string;
    medinan: string;
    summary: (n: number, typeLabel: string, verses: number) => string;
  };
  // (surahPage.summary combines the surah number, Meccan/Medinan label, and
  // verse count into one line: "Surah 2 · Medinan · 286 verses".)
  interlinearToggle: {
    show: string;
    hide: string;
  };
  ayahExplorer: {
    loadingOccurrences: string;
    heading: string;
    cardsView: string;
    kwicView: string;
  };
  filterBar: {
    allCategories: string;
    allLemmas: string;
    allSurahs: string;
    clearFilters: string;
    occurrencesCount: (count: number) => string;
  };
  pagination: {
    prev: string;
    next: string;
    pageOf: (page: number, count: number) => string;
  };
  relatedVerses: {
    heading: string;
    none: string;
    sharedCount: (count: number) => string;
  };
  ayahActions: {
    copyArabic: string;
    copyWithTranslation: string;
    openInSurah: string;
  };
  ayahCard: {
    pickthallLabel: string;
  };
  wordInfoPanel: {
    loading: string;
    notRooted: string;
    root: string;
    lemma: string;
    category: string;
    grammar: string;
    occurrencesOfRoot: (count: number) => string;
    occurrencesOfLemma: (count: number) => string;
    occurrencesOfForm: (count: number) => string;
    viewRootPage: string;
    viewWordPage: string;
    close: string;
  };
  ayahMorphologyTable: {
    toggleShow: string;
    toggleHide: string;
    loading: string;
    wordColumn: string;
    rootColumn: string;
    lemmaColumn: string;
    categoryColumn: string;
    grammarColumn: string;
    notRooted: string;
  };
  exportMenu: {
    exportLabel: string;
    csv: string;
    json: string;
    markdown: string;
    text: string;
  };
  copyTextButton: {
    defaultLabel: string;
    copied: string;
  };
  saveButton: {
    save: string;
    saved: string;
    removeAria: (label: string) => string;
    saveAria: (label: string) => string;
  };
  savedPage: {
    title: string;
    subtitle: string;
  };
  savedList: {
    rootsHeading: string;
    wordsHeading: string;
    versesHeading: string;
    empty: string;
    removeAria: (label: string) => string;
    notePlaceholder: string;
  };
  wordHeader: {
    lemmaLabel: string;
    rootPrefix: (root: string) => string;
    occurrences: string;
    surfaceForms: string;
  };
  aboutPage: {
    title: string;
    heading: string;
    intro: string;
    howCountsComputedHeading: string;
    howCountsComputedBody: string;
    insightsMethodologyHeading: string;
    insightsMethodologyIntro: string;
    coverageRankingHeading: string;
    coverageRankingBody: string;
    hapaxHeading: string;
    hapaxBody: string;
    rootDensityHeading: string;
    rootDensityBody: string;
    distinctiveVocabHeading: string;
    distinctiveVocabBody: string;
    rhymeMethodHeading: string;
    rhymeMethodBody: string;
    collocationsMethodHeading: string;
    collocationsMethodBody: string;
    abjadMethodHeading: string;
    abjadMethodBody: string;
    juzHizbHeading: string;
    juzHizbBody: string;
    cooccurrenceMethodHeading: string;
    cooccurrenceMethodBody: string;
    patternsMethodHeading: string;
    patternsMethodBody: string;
    formulasMethodHeading: string;
    formulasMethodBody: string;
    verseSimilarityMethodHeading: string;
    verseSimilarityMethodBody: string;
    dataSourcesHeading: string;
    laneLexiconNote: string;
    offlineHeading: string;
    offlineBody: string;
    downloaded: string;
    downloading: (pct: number) => string;
    downloadEverything: string;
    dataBuildHeading: string;
    dataBuildSummary: (date: string, words: number, roots: number, occurrences: number, verses: number) => string;
    corpusExportHeading: string;
    corpusExportBody: string;
    corpusExportDownload: (size: string) => string;
  };
}
