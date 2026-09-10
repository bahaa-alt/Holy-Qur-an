import type { Cat } from "@/lib/data/types";
import type { RootShape } from "@/lib/morphology/rootShape";
import type { Dict } from "./types";

const categories: Record<Cat, string> = {
  "verb.perf": "فعل ماضٍ",
  "verb.impf": "فعل مضارع",
  "verb.impv": "فعل أمر",
  noun: "اسم",
  actPcpl: "اسم فاعل",
  passPcpl: "اسم مفعول",
  verbalNoun: "مصدر",
  adj: "صفة",
  properNoun: "اسم علم",
  other: "أخرى",
};

const rootShapes: Record<RootShape, string> = {
  sound: "سالم (صحيح)",
  hollow: "أجوف (حرف العلة في الوسط)",
  defective: "ناقص (حرف العلة في الآخر)",
  assimilated: "مثال (حرف العلة في الأول)",
  geminate: "مضعّف (حرف مكرر)",
  hamzated: "مهموز (يحمل همزة)",
  quadriliteral: "رباعي",
};

/**
 * Typed against `Dict` (not against `en`), so a missing or misspelled key
 * fails at compile time. See en.ts's doc comment for the interpolation
 * design (functions, not template strings, so plural/word-order rules
 * don't have to match English's).
 */
export const ar: Dict = {
  common: {
    search: "بحث",
    copy: "نسخ",
    copied: "تم النسخ",
    save: "حفظ",
    saved: "محفوظ",
    loading: "جارٍ التحميل…",
    loadingVerses: "جارٍ تحميل الآيات…",
    clearFilters: "مسح عوامل التصفية",
    prev: "السابق",
    next: "التالي",
  },
  categories,
  rootShapes,
  nav: {
    logoFull: "بحث جذور القرآن",
    logoShort: "الجذور",
    quran: "القرآن الكريم",
    roots: "الجذور",
    compare: "مقارنة",
    search: "بحث",
    phrases: "العبارات",
    topics: "المواضيع",
    insights: "إحصاءات",
    saved: "المحفوظات",
    about: "عن الموقع",
  },
  footer: {
    tagline: "مجاني ومفتوح المصدر، بلا حسابات وبلا خوادم.",
    dataAndLicenses: "البيانات والتراخيص",
    source: "المصدر",
  },
  notFound: {
    title: "الصفحة غير موجودة",
    message: "هذا الجذر أو الكلمة أو الصفحة غير موجودة. جرّب البحث من الصفحة الرئيسية بدلاً من ذلك.",
    backToSearch: "العودة إلى البحث",
  },
  themeToggle: {
    switchToLight: "التبديل إلى المظهر الفاتح",
    switchToDark: "التبديل إلى المظهر الداكن",
  },
  languageToggle: {
    switchToArabic: "التبديل إلى العربية",
    switchToEnglish: "Switch to English",
  },
  offlineBadge: {
    offlineMode: "وضع عدم الاتصال",
  },
  serviceWorker: {
    updateAvailable: "يتوفر تحديث — إعادة التحميل",
  },
  installPrompt: {
    heading: "التثبيت للاستخدام دون اتصال",
    body: "أضِفه إلى الشاشة الرئيسية لاستخدامه كتطبيق أصلي، حتى دون اتصال بالإنترنت.",
    install: "تثبيت",
    notNow: "ليس الآن",
    dismissAria: "إغلاق",
  },
  searchBox: {
    ariaLabel: "البحث عن جذر أو كلمة أو ترجمة",
    placeholder: (example) => `ابحث عن جذر أو كلمة أو ترجمة… مثال: ${example}`,
  },
  suggestionList: {
    ariaLabel: "اقتراحات البحث",
  },
  suggestionKind: {
    root: "جذر",
    lemma: "كلمة",
    verse: "آية",
    search: "بحث",
  },
  home: {
    title: "بحث جذور القرآن وكلماته",
    subtitle:
      "ابحث بالجذر العربي، أو بالكلمة الدقيقة، أو بالترجمة الإنجليزية. استكشف كل صيغة مشتقة وكل ورود، مجانًا وبلا اتصال، دون حسابات أو خوادم.",
    mostFrequentRoots: "الجذور الأكثر ورودًا",
    browseAllRoots: (count) => `تصفح كل الجذور (${count.toLocaleString()}) ←`,
  },
  quran: {
    title: "القرآن الكريم",
    subtitle: "كل السور الـ114 بترتيب المصحف. افتح أي سورة لقراءة النص العثماني كاملاً مع الترجمة، كلمة كلمة.",
    filterPlaceholder: "تصفية السور بالاسم أو الرقم…",
    noMatch: (query) => `لا توجد سورة مطابقة لـ"${query}".`,
    meccan: "مكية",
    medinan: "مدنية",
    versesCount: (count) => `${count.toLocaleString()} آية`,
  },
  roots: {
    title: "تصفح كل الجذور",
    subtitle: (count) => `${count.toLocaleString()} جذرًا قرآنيًا، مرتبة أبجديًا.`,
  },
  rootsBrowser: {
    filterPlaceholder: "تصفية الجذور…",
    byLetter: "حسب الحرف",
    byShape: "حسب البِنية",
    noMatch: (query) => `لا يوجد جذر مطابق لـ"${query}".`,
    rootsCount: (count) => `${count.toLocaleString()} جذرًا`,
  },
  randomRootLink: {
    label: "جذر عشوائي",
  },
  rootHeader: {
    rootLabel: "الجذر",
    fullyMeccan: "١٠٠٪ مكية",
    fullyMedinan: "١٠٠٪ مدنية",
    meccanPct: (pct) => `${pct}٪ مكية`,
    meaningLabel: "المعنى (بحسب لسان العرب/لين): ",
    totalOccurrences: "إجمالي الورود",
    derivedLemmas: "الكلمات المشتقة",
    distinctForms: "الصيغ المختلفة",
    verses: "الآيات",
  },
  frequencyChart: {
    heading: "توزيع التكرار",
    byCategory: "حسب الفئة",
    byLemma: "حسب الكلمة",
  },
  formsTable: {
    heading: "الكلمات والمشتقات المرتبطة",
    subtitle: "كل صيغة مختلفة مشتقة من هذا الجذر، مع الكلمة الأصل وعدد ورودها.",
    colForm: "الصيغة",
    colLemma: "الكلمة",
    colCategory: "الفئة",
    colCount: "العدد",
  },
  conjugationTable: {
    heading: "تصريف الفعل",
    subtitle: "الصيغ المسجَّلة حسب باب الفعل والزمن والشخص/النوع/العدد. اضغط على صيغة لتصفية المستكشف أدناه.",
    form: (verbForm) => `الباب ${verbForm}`,
    occurrencesCount: (count) => `${count.toLocaleString()} ورودًا`,
  },
  surahDistribution: {
    heading: "التوزيع عبر السور",
    surahOrder: "ترتيب المصحف",
    revelationOrder: "ترتيب النزول",
    bySurahDescription: "أين يرد هذا الجذر عبر السور الـ114.",
    byRevelationDescription: "نفس الورود، مرتبة حسب التسلسل الزمني التقليدي (ترتيب النزول) بدلاً من ذلك.",
  },
  collocations: {
    heading: "الجذور المرافقة",
    description:
      "الجذور الأكثر ارتباطًا المميّزًا بهذا الجذر -- مرتبة حسب مدى تكرار مشاركتها لآية معه أكثر مما يُتوقع من تكرار كل منهما بمفرده، وليس بمجرد التكرار الخام.",
  },
  citeButton: {
    cite: "استشهاد",
    copied: "تم نسخ الاستشهاد",
  },
  compare: {
    title: "مقارنة الجذور",
    subtitle: "اختر حتى ثلاثة جذور لمقارنة أعداد ورودها وتوزيع فئاتها جنبًا إلى جنب.",
  },
  compareView: {
    loadingRoots: "جارٍ تحميل الجذور…",
    pickAtLeastOneMore: "اختر جذرًا واحدًا آخر على الأقل للمقارنة.",
    heatmapHeading: "أين يرد كل جذر عبر المصحف",
  },
  rootPicker: {
    heading: "الجذور المراد مقارنتها",
    subtitle: (max) => `اختر حتى ${max} جذور لمقارنتها جنبًا إلى جنب.`,
    removeAria: (root) => `إزالة ${root}`,
    searchPlaceholder: "ابحث عن جذر لإضافته…",
  },
  compareStatsTable: {
    heading: "الإحصاءات",
    totalOccurrences: "إجمالي الورود",
    derivedLemmas: "الكلمات المشتقة",
    distinctForms: "الصيغ المختلفة",
    verses: "الآيات",
    surahs: "السور",
  },
  compareCategoryBars: {
    heading: "توزيع الفئات",
  },
  phrasesPage: {
    title: "البحث عن العبارات",
    subtitle:
      "ابحث عن كل آية يرد فيها جذر ما مباشرة قبل كلمة من جذر آخر -- متجاوزًا الأدوات والضمائر بينهما -- لدراسة أنماط الأزواج اللفظية المتكررة.",
  },
  phraseSearch: {
    leadingRoot: "الجذر الأول",
    followedBy: "متبوعًا بـ",
    search: "بحث",
    noResults: "لم يُعثر على آيات يرد فيها الجذر الأول متبوعًا مباشرة بالجذر الثاني.",
    matchCount: (count, cap) =>
      `${count.toLocaleString()} نتيجة${count > cap ? ` (يُعرض أول ${cap})` : ""}.`,
  },
  rootSlotPicker: {
    clearAria: (label) => `مسح ${label}`,
    searchPlaceholder: "ابحث عن جذر…",
  },
  searchPage: {
    title: "البحث عن عبارة أو جملة",
    subtitle:
      'ابحث عن كل آية تحتوي على عبارة أو جملة محددة بالضبط -- افتتاحيات شائعة مثل "يا أيها الناس" أو "يا أيها الذين آمنوا"، أو أي تتابع من الكلمات تكتبه. لمطابقة أزواج الجذور بغض النظر عن الكلمات المستخدمة بالضبط، راجع صفحة',
    phrasesLinkLabel: "العبارات",
    subtitleAfterLink: "بدلاً من ذلك.",
    advancedSearchLinkLabel: "تبحث عن نمط نحوي بدلاً من ذلك؟ جرّب البحث المتقدم ←",
  },
  advancedSearchPage: {
    title: "البحث المتقدم",
    subtitle:
      "اجمع بين عدة معايير عبر المدونة كاملة -- الفئة، صيغة الفعل، جذر واحد أو أكثر، نطاق سور، والمكي/المدني -- للعثور على ما لا تستطيع صفحة جذر واحد وحدها الإجابة عنه، مثل كل اسم مفعول من الصيغة الثامنة في السور المدنية، أو كل ورود لأي من جذرين معًا.",
    loading: "جارٍ تحميل فهرس المدونة…",
    categoryLabel: "الفئة",
    verbFormLabel: "صيغة الفعل",
    rootLabel: "الجذر",
    rootPlaceholder: "اكتب جذرًا لتضييق النتائج…",
    rootClear: (root) => `إزالة الجذر ${root}`,
    surahRangeLabel: "نطاق السور",
    surahFromLabel: "من",
    surahToLabel: "إلى",
    revelationLabel: "النزول",
    revelationAll: "الكل",
    revelationMeccan: "مكية",
    revelationMedinan: "مدنية",
    clearFilters: "مسح كل المرشحات",
    resultCount: (count) => `${count.toLocaleString()} وروداً مطابقاً`,
    noResults: "لا يوجد ورود مطابق لهذه المرشحات.",
    pageOf: (page, total) => `صفحة ${page} من ${total}`,
    previousPage: "السابق",
    nextPage: "التالي",
    verbFormShort: (roman) => `الصيغة ${roman}`,
  },
  phraseTextSearch: {
    label: "عبارة أو جملة",
    search: "بحث",
    helperText:
      'يطابق الكلمات بالضبط وبنفس الترتيب (التشكيل اختياري) — مثال: "يا أيها الذين آمنوا" يجد كل آية تحتوي على هذه العبارة حرفيًا، وليس فقط الآيات التي تشترك في بعض كلماتها.',
    noResults: (query) => `لم يُعثر على آيات تحتوي على "${query}".`,
    matchCount: (count, cap) =>
      `${count.toLocaleString()} نتيجة${count > cap ? ` (يُعرض أول ${cap})` : ""}.`,
    copyThisPage: "نسخ هذه الصفحة",
  },
  topicsPage: {
    title: "تصفح حسب الموضوع",
    subtitle:
      "فهرس مُنتقى يدويًا يربط كل موضوع بالجذور/الكلمات التي تغطيه -- وليس مستخرجًا من أي تفسير. استخدمه لإيجاد الآيات المرشّحة بسرعة؛ فهو ليس حكمًا على معنى الآية، وقد تكون الآية متعلقة بموضوع دون أن تحوي أيًا من الجذور المذكورة.",
    themes: "المواضيع",
    prophets: "الأنبياء",
  },
  topicPage: {
    prophetLabel: "نبي",
    topicLabel: "موضوع",
    description: (count) =>
      `فهرس جذور/كلمات مُنتقى يدويًا، وليس مستخرجًا من تفسير -- نقطة انطلاق لإيجاد الآيات المرشّحة، وليس حكمًا على معنى الآية. عدد الآيات المطابقة: ${count.toLocaleString()}.`,
    noteLabel: "ملاحظة: ",
  },
  topicVerseList: {
    noMatches: "لم تُطابق أي آية جذور/كلمات هذا الموضوع.",
    copyThisPage: "نسخ هذه الصفحة",
  },
  insightsPage: {
    title: "إحصاءات",
    subtitle:
      "إحصاءات وطرائف على مستوى المدونة كاملة -- تكرار الحروف عبر أي نطاق، بالإضافة إلى مجموعة حقائق مُحتسبة مرة واحدة عبر القرآن كاملاً لا تستطيع صفحة جذر أو كلمة واحدة الإجابة عنها بمفردها.",
    tabFacts: "حقائق",
    tabLetters: "تكرار الحروف",
    tabCoverage: "انتشار المفردات",
    tabRhyme: "أنماط القوافي",
    tabVocabulary: "المفردات المميزة",
    tabCollocations: "تلازم الأفعال",
    tabAbjad: "حساب الجُمَّل",
    tabCooccurrence: "شبكة الجذور",
    tabPatterns: "الأوزان",
    tabFormulas: "التراكيب المتكررة",
    tabVerseSimilarity: "الآيات المتشابهة",
    letterFrequencyHeading: "تكرار الحروف",
    letterFrequencyDescription:
      "عدد مرات ورود كل حرف عربي، مع حذف التشكيل والإبقاء على تمايز صور الحرف (ة مقابل ه، ا مقابل أ/إ/آ/ٱ). اختر نطاقًا أدناه.",
    scopeAyah: "آية",
    scopeSurah: "سورة",
    scopeJuz: "جزء",
    scopeQuran: "القرآن كاملاً",
    surahLabel: "السورة",
    ayahLabel: "الآية",
    juzLabel: "الجزء",
    loading: "جارٍ عدّ الحروف…",
    noLetters: "لا حروف لعدّها في هذا الاختيار.",
    factsHeading: "حقائق مثيرة للاهتمام",
    factsDescription: "مُحتسبة مرة واحدة عبر المدونة كاملة وقت البناء -- أمور لا تستطيع صفحة جذر أو كلمة واحدة الإجابة عنها بمفردها.",
    rootsCoverageHeading: "الجذور حسب عدد السور التي ترد فيها",
    rootsCoverageDescription:
      "مرتّبة حسب انتشارها عبر السور لا حسب تكرارها الخام -- فقد يرد جذر كثيرًا لكن متمركزًا في عدد قليل من السور، أو نادرًا لكنه منتشر في كل مكان.",
    lemmasCoverageHeading: "الكلمات حسب عدد السور التي ترد فيها",
    lemmasCoverageDescription: "نفس الترتيب بمستوى أدق: كلمات محددة بالضبط (أصول كلمات)، سواء كان لها جذر أم لا.",
    surahCoverage: (surahCount, total) => `${surahCount} / ${total} سورة`,
    everySurahBadge: "كل سورة",
    longestVerseLabel: "أطول آية",
    shortestVerseLabel: "أقصر آية",
    wordsCount: (n) => `${n.toLocaleString()} كلمة`,
    longestWordLabel: "أطول كلمة",
    lettersCount: (n) => `${n.toLocaleString()} حرفًا`,
    mostFrequentLetterLabel: "أكثر الحروف ورودًا",
    leastFrequentLetterLabel: "أقل الحروف ورودًا",
    hapaxRootsLabel: "جذور وردت مرة واحدة فقط",
    hapaxLemmasLabel: "كلمات محددة وردت مرة واحدة فقط",
    mostDerivedRootLabel: "أغنى جذر اشتقاقًا",
    lemmasCount: (n) => `${n.toLocaleString()} كلمة مشتقة مختلفة`,
    mostFormsRootLabel: "الجذر الأكثر صيغًا سطحية",
    formsCount: (n) => `${n.toLocaleString()} صيغة مختلفة`,
    mostRootDenseVerseLabel: "أكثر آية كثافةً بالجذور",
    rootsInVerseCount: (roots, words) => `${roots} جذرًا مختلفًا عبر ${words} كلمة`,
    rhymeHeading: "أنماط القوافي (الفواصل)",
    rhymeDescription:
      "تُصنّف الدراسات البلاغية القرآنية الكلاسيكية (الفواصل/السجع) نهايات الآيات حسب حرفها الأخير. اضغط على حرف لرؤية الآيات المنتهية به.",
    rhymeLoading: "جارٍ تحميل نهايات الآيات…",
    rhymePickPrompt: "اختر حرف نهاية أعلاه لرؤية الآيات المطابقة.",
    rhymeShowingCount: (shown, total) => `عرض ${shown.toLocaleString()} من ${total.toLocaleString()} آية`,
    vocabHeading: "المفردات المميزة",
    vocabDescription:
      "أي الجذور ممثّلة بشكل زائد في سورة معيّنة مقارنةً بمعدلها على مستوى المدونة كاملة -- ما يميّز اختيار الألفاظ في هذه السورة، لا ما هو شائع في كل مكان.",
    vocabSurahLabel: "السورة",
    vocabLoading: "جارٍ التحميل…",
    vocabRatio: (ratio) => `${ratio}× المعدل`,
    vocabOccurrences: (n) => `${n.toLocaleString()} ورودًا في هذه السورة`,
    vocabNoResults: "لا جذر يتكرر بما يكفي في هذه السورة للترتيب (الحد الأدنى 3 ورودات).",
    collocationsHeading: "تلازم الأفعال وحروف الجر",
    collocationsDescription:
      "أي حرف جر يتبع عادةً ورودات جذر فعل معيّن -- سؤال حقيقي في النحو العربي (قد يتغيّر معنى الفعل بتغيّر حرف الجر المتعدي به، مثل آمن بـ مقابل آمن لـ).",
    collocationsRootPlaceholder: "اكتب جذر فعل…",
    collocationsLoading: "جارٍ التحميل…",
    collocationsNoResults: "لم يُتبع هذا الجذر مباشرةً بأحد حروف الجر المرصودة قط.",
    collocationsPickPrompt: "اختر جذرًا أعلاه لرؤية حروف الجر التي تتبع ورودات فعله.",
    abjadHeading: "حساب الجُمَّل (القيمة العددية للحروف)",
    abjadDescription:
      "النظام العربي القديم لترقيم الحروف (أبجد هوز حطي...) المستخدم تاريخيًا في التأريخ الشعري وعلم الحروف. لكل حرف قيمة ثابتة؛ وقيمة كلمة أو آية أو مقطع أكبر هي مجموع قيم حروفه.",
    abjadReferenceHeading: "قيم الحروف",
    abjadLoading: "جارٍ التحميل…",
    scopeHizb: "حزب",
    hizbLabel: "الحزب",
    abjadTotalLabel: "القيمة الإجمالية",
    abjadWordBreakdownHeading: "لكل كلمة",
    abjadLookupHeading: "البحث بالقيمة",
    abjadLookupDescription:
      "يعمل تقليد التأريخ بحساب الجُمَّل بالاتجاه العكسي: رقم مستهدف، يُطابَق بقيمة نص ما. أدخل رقمًا لإيجاد كل آية أو سورة كاملة تساوي قيمتها هذا الرقم تمامًا.",
    abjadLookupPlaceholder: "مثال: 786",
    abjadLookupInvalid: "أدخل عددًا صحيحًا موجبًا.",
    abjadLookupSurahsFound: (n) => `${n.toLocaleString()} سورة كاملة تطابق تمامًا`,
    abjadLookupVersesFound: (shown, total) => `${total.toLocaleString()} آية تطابق تمامًا${total > shown ? ` (يُعرض ${shown})` : ""}`,
    abjadLookupNoVerses: "لا آية تطابق هذه القيمة تمامًا.",
    cooccurrenceHeading: "شبكة تلازم الجذور",
    cooccurrenceDescription:
      "أي أزواج من الجذور ترد معًا في الآية نفسها بأكثر تكرار، عبر القرآن كاملاً -- بخلاف \"تلازم الأفعال\" (ما يظهر في آيات جذر واحد)، تُظهر هذه الميزة أكثر الأزواج تلازمًا واصطلاحًا على مستوى المدونة كاملة. الأزواج التي تشترك في أقل من 3 آيات تُستبعد باعتبارها ضجيجًا.",
    cooccurrenceTopPairsHeading: "أكثر الأزواج تكرارًا في المدونة كاملة",
    cooccurrenceRootPlaceholder: "اكتب جذرًا لرؤية أكثر شركائه تلازمًا…",
    cooccurrenceLoading: "جارٍ التحميل…",
    cooccurrenceNoResults: "هذا الجذر لا يشترك في 3 آيات أو أكثر مع أي جذر آخر.",
    cooccurrencePickPrompt: "اختر جذرًا أعلاه لرؤية أكثر الجذور تلازمًا معه.",
    cooccurrenceSharedVerses: (n) => `${n.toLocaleString()} آية مشتركة`,
    cooccurrenceGraphCaption:
      "أكثر 24 جذرًا ارتباطًا من بين أفضل 50 زوجًا. حجم العقدة وسمك الخط يعكسان كلاهما عدد مرات التلازم؛ مرّر المؤشر فوق خط لرؤية عدده الدقيق. اضغط على جذر لفتحه.",
    patternsHeading: "الأنماط الصرفية",
    patternsDescription:
      "مدى إنتاجية كل وزن فعل، وكل تصنيف اشتقاقي، وكل بنية جذر عبر المدونة كاملة -- نظرة عابرة للجذور توضّح أي الأنماط النحوية شائعة أو نادرة، بخلاف جدول الصيغ الخاص بجذر واحد.",
    patternsVerbFormsHeading: "إنتاجية أوزان الأفعال (I–XI)",
    patternsVerbFormsDescription:
      "عدد مرات ورود كل وزن من أوزان الفعل الكلاسيكية (يُحتسب الفعل غير الموسوم بالوزن الأول)، وعدد الجذور وأزواج الجذر-الكلمة المختلفة المنتجة له.",
    patternsCategoriesHeading: "توزيع التصنيفات الاشتقاقية",
    patternsCategoriesDescription: "عدد مرات ورود كل تصنيف نحوي عبر القرآن كاملاً، وعدد الجذور المختلفة المنتجة له.",
    patternsRootShapesHeading: "توزيع بنى الجذور",
    patternsRootShapesDescription:
      "كيف تتوزع جذور المدونة (وورداتها) عبر بنى الجذور السبع الكلاسيكية -- السالم، الأجوف، الناقص، المثال، المضاعف، المهموز، والرباعي.",
    patternsLoading: "جارٍ تحميل الأنماط…",
    patternsRootsCount: (n) => `${n.toLocaleString()} جذر`,
    patternsLemmasCount: (n) => `${n.toLocaleString()} زوج جذر-كلمة`,
    patternsDrilldownHint: "اضغط على شريط لرؤية ورداته المطابقة في البحث المتقدم.",
    patternsShapeRootsShown: (shown, total) => `عرض ${shown.toLocaleString()} من ${total.toLocaleString()} جذر، حسب عدد الورودات`,
    formulasHeading: "التراكيب المتكررة (الصيغ الثابتة)",
    formulasDescription:
      "تتابعات كلمات تتكرر بما يكفي، بنفس الألفاظ تمامًا، لتكون مرشحة كتعبيرات ثابتة -- يسمّي علم البلاغة القرآني الكلاسيكي هذا التكرار. نوافذ منزلقة من 3 إلى 6 كلمات متتالية داخل الآية الواحدة فقط، لا تتجاوز حدود الآية أبدًا؛ التراكيب الأقصر تحتاج تكرارًا أعلى لتتأهل، لأنها تتكرر أكثر بمحض الصدفة النحوية.",
    formulasWordsLength: (n) => `${n} كلمات`,
    formulasLoading: "جارٍ تحميل التراكيب…",
    formulasNoResults: "لا تركيب بهذا الطول يتكرر بما يكفي ليتأهل.",
    formulasOccurrencesCount: (n) => `${n.toLocaleString()} ورودًا`,
    verseSimilarityHeading: "الآيات المتشابهة",
    verseSimilarityDescription:
      "أزواج آيات تشترك في نسبة عالية بشكل غير معتاد من جذورها المختلفة، حتى عندما يختلف اللفظ تمامًا -- بخلاف التراكيب المتكررة (عبارات متطابقة تتكرر حرفيًا)، تكشف هذه الميزة آيات متوازية موضوعيًا أو بنيويًا، كقائمة متكررة أو نمط سردي مشترك عبر قصص مختلفة.",
    verseSimilarityLoading: "جارٍ التحميل…",
    verseSimilaritySharedRoots: (n) => `${n} جذرًا مشتركًا`,
    verseSimilarityJaccard: (pct) => `${pct}٪ تداخل`,
    verseSimilarityPickPrompt: "اختر زوجًا أعلاه لمقارنة الآيتين.",
    sortByFrequency: "التكرار",
    sortByPmi: "القوة الإحصائية (PMI)",
    pmiExplanation:
      "يقيس مقياس PMI مدى ورود شيئين معًا أكثر (أو أقل) من الصدفة، مع تصحيح لمدى شيوع كل منهما بمفرده -- بخلاف التكرار الخام، لا ينحاز نحو العناصر الشائعة فحسب.",
    pmiLabel: (value) => `PMI ${value}`,
  },
  formulaDetailPage: {
    backToInsights: "← العودة إلى الإحصاءات",
    summary: (length, count) => `تركيب من ${length} كلمات، ورد ${count.toLocaleString()} مرة عبر القرآن.`,
  },
  surahInsights: {
    heading: "هذه السورة بلمحة",
    distinctiveVocabHeading: "المفردات المميزة",
    distinctiveVocabEmpty: "لا جذر يتكرر بما يكفي في هذه السورة للترتيب.",
    rhymeHeading: "نهاية الآيات الغالبة",
    rhymeSummary: (count, total) => `${count.toLocaleString()} من ${total.toLocaleString()} آية`,
    rhymeEmpty: "لا آيات لتحليلها.",
    abjadHeading: "قيمة حساب الجُمَّل",
    abjadValue: (n) => n.toLocaleString(),
    viewMoreInInsights: "المزيد من أدوات البحث في صفحة الإحصاءات ←",
  },
  surahPage: {
    previous: "السابقة",
    next: "التالية",
    meccan: "مكية",
    medinan: "مدنية",
    summary: (n, typeLabel, verses) => `سورة ${n} · ${typeLabel} · ${verses.toLocaleString()} آية`,
  },
  ayahExplorer: {
    loadingOccurrences: "جارٍ تحميل مواضع الورود…",
    heading: "مستكشف الآيات السياقي",
    cardsView: "بطاقات",
    kwicView: "سياق الكلمة",
  },
  filterBar: {
    allCategories: "كل الفئات",
    allLemmas: "كل الكلمات",
    allSurahs: "كل السور",
    clearFilters: "مسح عوامل التصفية",
    occurrencesCount: (count) => `${count.toLocaleString()} موضع ورود`,
  },
  pagination: {
    prev: "السابق",
    next: "التالي",
    pageOf: (page, count) => `صفحة ${page} من ${count}`,
  },
  relatedVerses: {
    heading: "آيات ذات صلة",
    none: "لم يُعثر على آيات وثيقة الصلة.",
    sharedCount: (count) => `· ${count} مشترك`,
  },
  ayahActions: {
    copyArabic: "نسخ النص العربي",
    copyWithTranslation: "نسخ مع الترجمة",
    openInSurah: "فتح في السورة",
  },
  ayahCard: {
    pickthallLabel: "بيكثال: ",
  },
  wordInfoPanel: {
    loading: "جارٍ البحث عن هذه الكلمة…",
    notRooted: "هذه أداة أو ضمير أو لاصقة نحوية -- لا تحمل جذرًا في هذه المدونة.",
    root: "الجذر",
    lemma: "الكلمة",
    category: "الفئة",
    grammar: "الإعراب",
    occurrencesOfRoot: (count) => `${count.toLocaleString()} ورودًا لهذا الجذر`,
    occurrencesOfLemma: (count) => `${count.toLocaleString()} ورودًا لهذه الكلمة`,
    occurrencesOfForm: (count) => `${count.toLocaleString()} ورودًا لهذه الصيغة بالضبط`,
    viewRootPage: "عرض صفحة الجذر",
    viewWordPage: "عرض صفحة الكلمة",
    close: "إغلاق",
  },
  ayahMorphologyTable: {
    toggleShow: "عرض التحليل الصرفي الكامل",
    toggleHide: "إخفاء التحليل الصرفي الكامل",
    loading: "جارٍ تحليل كل كلمة…",
    wordColumn: "الكلمة",
    rootColumn: "الجذر",
    lemmaColumn: "أصل الكلمة",
    categoryColumn: "الفئة",
    grammarColumn: "الإعراب",
    notRooted: "أداة / ضمير / لاصقة نحوية -- لا جذر لها",
  },
  exportMenu: {
    exportLabel: "تصدير:",
    csv: "CSV",
    json: "JSON",
    markdown: "Markdown",
    text: "نص",
  },
  copyTextButton: {
    defaultLabel: "نسخ كـ Markdown",
    copied: "تم النسخ",
  },
  saveButton: {
    save: "حفظ",
    saved: "محفوظ",
    removeAria: (label) => `إزالة ${label} من المحفوظات`,
    saveAria: (label) => `حفظ ${label}`,
  },
  savedPage: {
    title: "المحفوظات",
    subtitle: "الجذور والكلمات والآيات التي حفظتها، مع مساحة لملاحظاتك الخاصة. تُخزَّن في هذا المتصفح فقط -- لا يُرسل شيء إلى أي مكان.",
  },
  savedList: {
    rootsHeading: "الجذور",
    wordsHeading: "الكلمات",
    versesHeading: "الآيات",
    empty: 'لا يوجد شيء محفوظ بعد. استخدم زر "حفظ" في صفحة أي جذر أو كلمة أو آية لإضافتها هنا.',
    removeAria: (label) => `إزالة ${label}`,
    notePlaceholder: "أضف ملاحظة…",
  },
  wordHeader: {
    lemmaLabel: "الكلمة",
    rootPrefix: (root) => `الجذر: ${root}`,
    occurrences: "الورود",
    surfaceForms: "الصيغ الظاهرة",
  },
  aboutPage: {
    title: "عن الموقع",
    heading: "عن هذا المشروع",
    intro:
      "أداة مجانية ومفتوحة المصدر وبلا حسابات للبحث في جذور القرآن الكريم وصيغ كلماته. يعمل بالكامل في متصفحك كموقع ثابت: بلا حسابات، بلا تسجيل دخول، بلا خادم قاعدة بيانات. تُشحن كل البيانات كملفات ثابتة وتعمل بلا اتصال بالكامل بعد التثبيت.",
    howCountsComputedHeading: "كيف تُحسب الأعداد",
    howCountsComputedBody:
      '"الورود" لجذر ما هو مقطع صرفي وُسم بذلك الجذر في المدونة اللغوية الأساسية. الأدوات والضمائر واللواصق النحوية (مثل أداة التعريف "ال" أو الضمائر المتصلة) لا تحمل جذرًا أبدًا ولا تُحتسب ضمنه، رغم ظهورها في نص الآية. هذا يطابق طريقة احتساب الجذور في المدونة العربية القرآنية (Quranic Arabic Corpus) نفسها، وقد يختلف عن أدوات تحتسب الكلمة المصرَّفة كاملة.',
    insightsMethodologyHeading: "كيف تُحتسب أرقام صفحة الإحصاءات",
    insightsMethodologyIntro:
      "تضيف صفحة الإحصاءات (تكرار الحروف، الحقائق، أنماط القوافي، المفردات المميزة، تلازم الأفعال، حساب الجُمَّل) عدة مقاييس تتجاوز عدّ الورود البسيط. كل مقياس موثّق هنا حتى يمكن الاستشهاد بالرقم وفهمه، لا مجرد عرضه.",
    coverageRankingHeading: "ترتيب الانتشار عبر السور",
    coverageRankingBody:
      "قوائم \"أي الجذور/الكلمات ترد في أكبر عدد من السور\" مرتّبة حسب عدد السور المختلفة التي يرد فيها الجذر أو الكلمة المحددة (أصل الكلمة) -- لا حسب التكرار الخام. فقد يرد جذر كثيرًا لكن متمركزًا في عدد قليل من السور، أو نادرًا لكنه منتشر في معظمها؛ هذا يرتّب حسب النوع الثاني من الانتشار. تُعرض أفضل 15 لكل قائمة.",
    hapaxHeading: "الجذور/الكلمات الوحيدة الورود",
    hapaxBody:
      "جذر أو كلمة محددة وردت مرة واحدة فقط في كل القرآن -- مقياس معياري في اللسانيات الحاسوبية لاتساع المفردات، مُحتسب بشكل منفصل للجذور وللكلمات المحددة (أصول الكلمات)، إذ قد يكون الجذر وحيد الورود بينما له عدة صيغ سطحية، أو العكس.",
    rootDensityHeading: "أكثر آية كثافةً بالجذور",
    rootDensityBody:
      "مرتّبة حسب الكثافة -- عدد الجذور المختلفة مقسومًا على عدد الكلمات -- بين الآيات التي لا يقل عدد كلماتها عن 10، لا حسب عدد الجذور الخام. فالعدد الخام سيكرر ببساطة أطول آية (2:282، المعروضة أصلاً بشكل منفصل كأطول آية)؛ والحد الأدنى للطول يمنع آية قصيرة جدًا من التصدّر بمحض الصدفة.",
    distinctiveVocabHeading: "المفردات المميزة",
    distinctiveVocabBody:
      "لكل سورة، تُرتَّب الجذور حسب مدى تمثيلها الزائد فيها مقارنةً بمعدلها في القرآن كاملاً: (ورودها في هذه السورة ÷ عدد كلمات هذه السورة) مقسومًا على (ورودها إجمالاً ÷ إجمالي عدد كلمات القرآن). يجب أن يرد الجذر 3 مرات على الأقل داخل السورة ليتأهل -- فبدون هذا الحد الأدنى، يمكن لجذر ورد مرة واحدة فقط في سورة قصيرة أن يسجّل بمحض الصدفة عدة أضعاف معدل المدونة.",
    rhymeMethodHeading: "أنماط القوافي (الفواصل)",
    rhymeMethodBody:
      '"نهاية" كل آية هي الحرف الأخير من كلمتها الأخيرة، مع حذف التشكيل -- وهي الوحدة التي تستخدمها الدراسات البلاغية القرآنية الكلاسيكية (الفواصل/السجع) لتصنيف نهايات الآيات. صور الحروف (ة مقابل ه، صور الألف) لا تُوحَّد هنا، بما يطابق اصطلاح جدول تكرار الحروف.',
    collocationsMethodHeading: "تلازم الأفعال وحروف الجر",
    collocationsMethodBody:
      "لكل ورود لجذر فعل، يُتحقّق مما إذا كانت الكلمة التالية مباشرةً -- أو، في حالة لاصقة من حرف واحد مثل بِ/لِ/كَ، مقطع البادئة المتصل بتلك الكلمة -- أحد عشرة حروف جر عربية أساسية (ب ل ك من إلى على في عن مع حتى). الاقتصار على هذه القائمة بدلاً من أي أداة تالية يجعل النتيجة تعكس التعدي النحوي للفعل تحديدًا، لا مجاورة عرضية لحرف عطف أو نفي أو استفهام. يحصل كل توليف أيضًا على درجة PMI (المعلومات المتبادلة النقطية) إلى جانب تكراره الخام، محسوبة عبر كل ورودات الأفعال المرصودة التي تتبعها كلمة أخرى: يسأل PMI ما إذا كان حرف جر معيّن يتبع فعلاً معيّنًا أكثر مما يتوقعه تكراره العام في ذلك النطاق، فلا يهيمن عليه حرف الجر الشائع كما يحدث مع التكرار الخام.",
    abjadMethodHeading: "حساب الجُمَّل (القيمة العددية للحروف)",
    abjadMethodBody:
      "يجمع قيمة كل حرف في نظام الترقيم العربي الكلاسيكي ذي الثمانية والعشرين حرفًا (أبجد هوز حطي...)، بعد حذف التشكيل وتوحيد صور الألف وحاملات الهمزة (أ إ آ ٱ ء ؤ ئ) إلى ا، وتاء التأنيث المربوطة (ة) إلى ه، والألف المقصورة (ى) إلى ي -- إذ لا قيمة منفصلة للهمزة في هذا النظام الذي يسبق ظهورها كحرف مستقل. ميزة \"البحث بالقيمة\" تعكس هذا الاتجاه: تُحسب قيمة كل آية وكل سورة مسبقًا وقت البناء، فيمكن مطابقة رقم مستهدف عبر المدونة كاملة (بحث عن تطابق تام) بدلاً من عبارة واحدة مختارة يدويًا، تمامًا كما يعمل تأليف التأريخ الشعري الكلاسيكي نفسه.",
    juzHizbHeading: "حدود الأجزاء والأحزاب",
    juzHizbBody:
      "تقسيم القرآن إلى 30 جزءًا و60 حزبًا هو تقسيم هيكلي معياري للمصحف، لا علاقة له بمدونة الصرف المذكورة أعلاه. جرى التحقق من هذه الحدود مقابل مصدرين مستقلين مُعدّين من قبل المجتمع (راجع الشيفرة المصدرية للمشروع للاطلاع على المراجع الدقيقة وسجل التعديلات)؛ وقد كشف هذا التحقق خطأين معزولين في حدود الأحزاب لدى أحد المصدرين وصُحِّحا قبل النشر.",
    cooccurrenceMethodHeading: "شبكة تلازم الجذور",
    cooccurrenceMethodBody:
      "لكل آية، تُجمع جذورها المختلفة الواردة فيها، ثم يُحتسب كل زوج غير مرتّب من الجذور يشترك في آية واحدة على الأقل، عبر القرآن كاملاً -- بخلاف ميزة \"تلازم الأفعال\" لكل جذر على حدة (ما يظهر في آيات جذر واحد فقط)، تُرتّب هذه الميزة الأزواج على مستوى المدونة كاملة. يُستبعد الزوج الذي يشترك في أقل من 3 آيات باعتباره ضجيجًا؛ تُعرض أفضل 50 زوجًا إجمالاً وأفضل 5 شركاء لكل جذر. التكرار الخام منحاز نحو الجذور الشائعة (جذران شائعان جدًا سيتلازمان كثيرًا لمجرد أن كلاًّ منهما موجود في كل مكان)، لذا يحصل كل زوج أيضًا على درجة PMI، باستخدام معدل ورود كل جذر عبر المدونة كخط أساس -- فإذا كانت PMI موجبة فهذا يعني أن الزوج يتلازم أكثر مما يتوقعه ذلك الخط الأساسي، فيُظهر تلازمات مميزة يفوتها الترتيب بالتكرار وحده، بما فيها تلازمات نادرة لكنها شديدة الارتباط.",
    patternsMethodHeading: "الأنماط الصرفية",
    patternsMethodBody:
      "يُصنَّف كل مقطع مرتبط بجذر حسب وزن الفعل (I–XI؛ يُحتسب الفعل غير الموسوم بالوزن الأول تلقائيًا، بما يوافق اصطلاح جدول التصريف لكل جذر)، وحسب التصنيف الاشتقاقي نفسه المستخدم في بقية التطبيق، وحسب بنية الجذر (سالم، أجوف، ناقص، مثال، مضعّف، مهموز، رباعي -- انظر تجميع \"حسب البنية\" في صفحة تصفح الجذور). ثم يُحتسب كل تصنيف عبر جميع جذور المدونة، فتُعطى أعداد الورودات والجذور المختلفة لكل وزن/تصنيف/بنية -- نظرة إنتاجية عابرة للجذور، لا تفصيلاً لكل جذر على حدة.",
    formulasMethodHeading: "التراكيب المتكررة (الصيغ الثابتة)",
    formulasMethodBody:
      "لكل آية، يُطبَّع ويُحتسب كل تتابع متصل من 3 و4 و5 و6 كلمات (نافذة منزلقة لا تتجاوز الآية التالية أبدًا) عبر القرآن كاملاً؛ يُرتَّب كل طول على حدة، بحيث يظهر تركيب من 3 كلمات والتركيب من 4 كلمات المحتوي عليه كإدخالين منفصلين. التراكيب الأقصر تحتاج تكرارًا أكبر لتتأهل (حدود دنيا 6/4/3/3 ورودًا للأطوال 3-6) لأن التتابعات القصيرة تتكرر أكثر بمحض الصدفة النحوية وحدها؛ تُعرض أفضل 25 تركيبًا لكل طول، ويربط كل منها بصفحة تسرد كل ورود له مع نص الآية كاملاً.",
    verseSimilarityMethodHeading: "الآيات المتشابهة",
    verseSimilarityMethodBody:
      "لكل آية، تُجمع جذورها المختلفة الواردة فيها. تُقترح الأزواج المرشحة فقط عبر الجذور التي ترد في 60 آية أو أقل (فالجذر الشائع مثل \"أله\" ليس مؤشرًا ذا معنى بمفرده)، ثم يُقيَّم كل مرشح بتشابه جاكار الكامل (الجذور المشتركة ÷ اتحاد الجذور المختلفة للآيتين) على كامل مجموعة جذور كل آية. يحتاج الزوج إلى 4 جذور مشتركة على الأقل وتداخل 40٪ ليتأهل؛ تُعرض أفضل 50 زوجًا. قد يفوت هذا الأسلوب زوجًا متشابهًا حقًا يشترك في جذور شائعة فقط -- فهو يضحي بالشمولية للإبقاء على المقارنة عبر المدونة كاملة بدلاً من زوج واحد يُختار يدويًا.",
    dataSourcesHeading: "مصادر البيانات والتراخيص",
    laneLexiconNote:
      'معاني الجذور معروضة كـ"بحسب معجم لين" -- وهي ملخص مأخوذ من تلك المجموعة، وليست اقتباسًا حرفيًا من المعجم الأصلي الصادر في القرن التاسع عشر. الكود المصدري لهذا المشروع مرخّص بموجب GPL-3.0، بما يطابق شروط الترخيص المتحرر (copyleft) لمجموعة بيانات التحليل الصرفي التي يُبنى عليها.',
    offlineHeading: "العمل بلا اتصال والتثبيت",
    offlineBody:
      'على أي متصفح جوال أو حاسوب يدعم ذلك، استخدم "إضافة إلى الشاشة الرئيسية" (أو اقتراح التثبيت الذي يعرضه الموقع بعد بضع زيارات) لتثبيته كتطبيق أصلي. بعد التثبيت، تبقى الجذور والسور التي زُرتها سابقًا متاحة بلا اتصال، ويمكن للتطبيق تنزيل المدونة الكاملة في الخلفية للوصول الكامل بلا اتصال.',
    downloaded: "تم التنزيل للاستخدام بلا اتصال.",
    downloading: (pct) => `جارٍ التنزيل… ${pct}٪`,
    downloadEverything: "تنزيل كل شيء للاستخدام بلا اتصال",
    dataBuildHeading: "بناء البيانات",
    dataBuildSummary: (date, words, roots, occurrences, verses) =>
      `بُني في ${date} · ${words.toLocaleString()} كلمة · ${roots.toLocaleString()} جذرًا · ${occurrences.toLocaleString()} موضع ورود جذر عبر ${verses.toLocaleString()} آية.`,
    corpusExportHeading: "تصدير المدونة كاملة",
    corpusExportBody:
      "كل كلمة في القرآن في ملف CSV واحد -- السورة، الآية، الكلمة، الجذر، الكلمة المشتقة، التصنيف النحوي، الوسوم، وكلا الترجمتين الإنجليزيتين -- للتحليل في Excel أو pandas أو R أو أي أداة أخرى خارج هذا التطبيق. هذه هي نفس البيانات التي تُبنى منها كل صفحة هنا، دون ترشيح.",
    corpusExportDownload: (size) => `تنزيل المدونة كاملة (CSV، ${size})`,
  },
};
