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
  },
};
