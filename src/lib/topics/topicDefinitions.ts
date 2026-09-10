/**
 * The curated topic index: a hand-picked mapping from research topic to the
 * roots/lemmas that cover it, verified against the built corpus
 * (public/data/v1/index.json) at the time this file was written.
 *
 * This is deliberately NOT derived from parsing any tafsir (classical
 * commentary) -- it is a keyword/root index a researcher can use as a
 * starting point, not a claim about what a given school of tafsir
 * considers a verse to be "about". A verse can touch a topic without using
 * any of these roots (metaphor, narrative context, pronouns referring back
 * to an earlier-named subject), and a root can appear without the verse
 * being substantively about the topic (a root's dominant sense isn't
 * always the operative one in a given verse). Every topic page says this
 * plainly; treat this as a fast way to *find candidate verses*, not as a
 * verdict on what a verse means.
 *
 * `src/test/topicDefinitions.test.ts` asserts every root/lemma key
 * referenced here actually exists in the built corpus, so a typo or a
 * future corpus change fails loudly instead of silently resolving to zero
 * verses.
 */

export type TopicSource =
  /** every occurrence of this root, whatever lemma it's classified under */
  | { kind: "root"; root: string }
  /** only the occurrences of one specific lemma within a root shared with unrelated lemmas */
  | { kind: "rootedLemma"; root: string; lemmaKey: string }
  /** a lemma with no root of its own (RootFile.root === null) */
  | { kind: "rootlessLemma"; lemmaKey: string };

export interface TopicDefinition {
  slug: string;
  labelEn: string;
  labelAr: string;
  category: "theme" | "prophet";
  /** One-line explanation of scope and any known ambiguity, shown on the topic page. */
  note?: string;
  sources: TopicSource[];
}

function root(r: string): TopicSource {
  return { kind: "root", root: r };
}
function rootedLemma(r: string, lemmaKey: string): TopicSource {
  return { kind: "rootedLemma", root: r, lemmaKey };
}
function rootlessLemma(lemmaKey: string): TopicSource {
  return { kind: "rootlessLemma", lemmaKey };
}

export const THEME_TOPICS: TopicDefinition[] = [
  {
    slug: "marriage",
    labelEn: "Marriage",
    labelAr: "الزواج",
    category: "theme",
    sources: [root("نكح"), root("زوج")],
  },
  {
    slug: "divorce",
    labelEn: "Divorce",
    labelAr: "الطلاق",
    category: "theme",
    sources: [root("طلق")],
  },
  {
    slug: "trade-and-debt",
    labelEn: "Trade & Debt",
    labelAr: "التجارة والدين",
    category: "theme",
    note: "دين covers both \"debt\" and \"religion\" in this corpus (one root, two senses) -- results include both.",
    sources: [root("تجر"), root("بيع"), root("ربو"), root("دين")],
  },
  {
    slug: "prayer",
    labelEn: "Prayer (Ṣalāh)",
    labelAr: "الصلاة",
    category: "theme",
    sources: [root("صلو"), root("سجد"), root("ركع")],
  },
  {
    slug: "supplication",
    labelEn: "Supplication (Duʿāʾ)",
    labelAr: "الدعاء",
    category: "theme",
    note: "دعو also covers \"to call/summon\" more generally, not only prayerful supplication.",
    sources: [root("دعو")],
  },
  {
    slug: "hajj-and-pilgrimage",
    labelEn: "Ḥajj & Pilgrimage",
    labelAr: "الحج",
    category: "theme",
    note: "عمر (ʿumrah) shares its root with \"age/lifespan\"; filtered to the lemmas عُمْرَة and اعْتَمَرَ so unrelated senses are excluded.",
    sources: [root("حجج"), root("طوف"), rootedLemma("عمر", "عمره"), rootedLemma("عمر", "اعتمر")],
  },
  {
    slug: "fasting",
    labelEn: "Fasting (Ṣawm)",
    labelAr: "الصيام",
    category: "theme",
    sources: [root("صوم")],
  },
  {
    slug: "zakah-and-charity",
    labelEn: "Zakah & Charity",
    labelAr: "الزكاة والصدقة",
    category: "theme",
    note: "صدق also covers \"truth/sincerity\" generally; filtered to the charity-related lemmas (صَدَقَة, تَصَدَّقَ, مُتَصَدِّق, مُتَصَدِّقَة) so the far more common \"truthful/confirming\" senses are excluded.",
    sources: [
      root("زكو"),
      rootedLemma("صدق", "صدقه"),
      rootedLemma("صدق", "تصدق"),
      rootedLemma("صدق", "متصدق"),
      rootedLemma("صدق", "متصدقه"),
      rootedLemma("صدق", "مصدقه"),
    ],
  },
  {
    slug: "inheritance",
    labelEn: "Inheritance",
    labelAr: "الميراث",
    category: "theme",
    sources: [root("ورث")],
  },
  {
    slug: "jihad-and-striving",
    labelEn: "Jihād & Striving",
    labelAr: "الجهاد",
    category: "theme",
    sources: [root("جهد")],
  },
  {
    slug: "knowledge",
    labelEn: "Knowledge",
    labelAr: "العلم",
    category: "theme",
    sources: [root("علم")],
  },
  {
    slug: "patience",
    labelEn: "Patience",
    labelAr: "الصبر",
    category: "theme",
    sources: [root("صبر")],
  },
  {
    slug: "repentance",
    labelEn: "Repentance (Tawbah)",
    labelAr: "التوبة",
    category: "theme",
    sources: [root("توب")],
  },
  {
    slug: "paradise-and-gardens",
    labelEn: "Paradise & Gardens",
    labelAr: "الجنة",
    category: "theme",
    note: "Filtered to the lemma جَنَّة (garden/paradise); a small number of matches are جِنَّة (\"madness\", e.g. 7:184) and جُنَّة (\"shield\"), which share its diacritic-stripped key.",
    sources: [rootedLemma("جنن", "جنه")],
  },
  {
    slug: "jinn",
    labelEn: "Jinn",
    labelAr: "الجن",
    category: "theme",
    note: "Filtered to the lemma جِنّ; excludes جان (which can also mean \"serpent\") and مَجْنُون (\"madman\"), both unrelated senses sharing the same root.",
    sources: [rootedLemma("جنن", "جن")],
  },
  {
    slug: "punishment",
    labelEn: "Punishment & Torment",
    labelAr: "العذاب",
    category: "theme",
    sources: [root("عذب")],
  },
  {
    slug: "creation",
    labelEn: "Creation",
    labelAr: "الخلق",
    category: "theme",
    sources: [root("خلق")],
  },
  {
    slug: "mercy",
    labelEn: "Mercy",
    labelAr: "الرحمة",
    category: "theme",
    sources: [root("رحم")],
  },
  {
    slug: "death",
    labelEn: "Death",
    labelAr: "الموت",
    category: "theme",
    sources: [root("موت")],
  },
  {
    slug: "resurrection",
    labelEn: "Resurrection",
    labelAr: "البعث",
    category: "theme",
    sources: [root("بعث")],
  },
  {
    slug: "disbelief",
    labelEn: "Disbelief (Kufr)",
    labelAr: "الكفر",
    category: "theme",
    sources: [root("كفر")],
  },
  {
    slug: "faith",
    labelEn: "Faith (Īmān)",
    labelAr: "الإيمان",
    category: "theme",
    sources: [root("أمن")],
  },
  {
    slug: "shirk",
    labelEn: "Shirk (Associating Partners)",
    labelAr: "الشرك",
    category: "theme",
    sources: [root("شرك")],
  },
  {
    slug: "guidance-and-misguidance",
    labelEn: "Guidance & Misguidance",
    labelAr: "الهدى والضلال",
    category: "theme",
    sources: [root("هدي"), root("ضلل")],
  },
  {
    slug: "forgiveness",
    labelEn: "Forgiveness",
    labelAr: "المغفرة",
    category: "theme",
    sources: [root("غفر")],
  },
  {
    slug: "justice-and-wrongdoing",
    labelEn: "Justice & Wrongdoing",
    labelAr: "العدل والظلم",
    category: "theme",
    sources: [root("قسط"), root("ظلم")],
  },
  {
    slug: "fear-and-reverence",
    labelEn: "Fear & Reverence",
    labelAr: "الخوف",
    category: "theme",
    sources: [root("خوف")],
  },
  {
    slug: "gratitude",
    labelEn: "Gratitude",
    labelAr: "الشكر",
    category: "theme",
    sources: [root("شكر")],
  },
  {
    slug: "revelation-and-prophecy",
    labelEn: "Revelation & Prophecy",
    labelAr: "الوحي والرسالة",
    category: "theme",
    sources: [root("وحي"), root("نبأ"), root("رسل")],
  },
  {
    slug: "kingship-and-dominion",
    labelEn: "Kingship & Dominion",
    labelAr: "الملك",
    category: "theme",
    sources: [root("ملك")],
  },
  {
    slug: "obligations-and-prohibitions",
    labelEn: "Obligations & Prohibitions",
    labelAr: "الفرائض والمحرمات",
    category: "theme",
    note: "حرم also covers \"sacred/inviolable\" (e.g. the sacred mosque), not only legal prohibition.",
    sources: [root("فرض"), root("حرم")],
  },
];

export const PROPHET_TOPICS: TopicDefinition[] = [
  { slug: "adam", labelEn: "Adam", labelAr: "آدم", category: "prophet", sources: [root("أدم")] },
  { slug: "nuh", labelEn: "Nūḥ (Noah)", labelAr: "نوح", category: "prophet", sources: [rootlessLemma("نوح")] },
  {
    slug: "ibrahim",
    labelEn: "Ibrāhīm (Abraham)",
    labelAr: "إبراهيم",
    category: "prophet",
    sources: [rootlessLemma("ابراهيم")],
  },
  {
    slug: "ismail",
    labelEn: "Ismāʿīl (Ishmael)",
    labelAr: "إسماعيل",
    category: "prophet",
    sources: [rootlessLemma("اسماعيل")],
  },
  {
    slug: "ishaq",
    labelEn: "Isḥāq (Isaac)",
    labelAr: "إسحاق",
    category: "prophet",
    sources: [rootlessLemma("اسحاق")],
  },
  {
    slug: "yaqub",
    labelEn: "Yaʿqūb (Jacob)",
    labelAr: "يعقوب",
    category: "prophet",
    sources: [rootlessLemma("يعقوب")],
  },
  {
    slug: "yusuf",
    labelEn: "Yūsuf (Joseph)",
    labelAr: "يوسف",
    category: "prophet",
    sources: [rootlessLemma("يوسف")],
  },
  { slug: "musa", labelEn: "Mūsā (Moses)", labelAr: "موسى", category: "prophet", sources: [rootlessLemma("موسي")] },
  {
    slug: "harun",
    labelEn: "Hārūn (Aaron)",
    labelAr: "هارون",
    category: "prophet",
    sources: [rootlessLemma("هارون")],
  },
  { slug: "dawud", labelEn: "Dāwūd (David)", labelAr: "داود", category: "prophet", sources: [rootlessLemma("داود")] },
  {
    slug: "sulaiman",
    labelEn: "Sulaymān (Solomon)",
    labelAr: "سليمان",
    category: "prophet",
    sources: [rootlessLemma("سليمان")],
  },
  { slug: "ayyub", labelEn: "Ayyūb (Job)", labelAr: "أيوب", category: "prophet", sources: [rootlessLemma("ايوب")] },
  {
    slug: "yunus",
    labelEn: "Yūnus (Jonah)",
    labelAr: "يونس",
    category: "prophet",
    sources: [rootlessLemma("يونس")],
  },
  { slug: "lut", labelEn: "Lūṭ (Lot)", labelAr: "لوط", category: "prophet", sources: [rootlessLemma("لوط")] },
  {
    slug: "hud",
    labelEn: "Hūd",
    labelAr: "هود",
    category: "prophet",
    note: "The root هود also covers \"to become/be Jewish\" (هاد، يهود) -- filtered here to just the lemma هُود.",
    sources: [rootedLemma("هود", "هود")],
  },
  {
    slug: "salih",
    labelEn: "Ṣāliḥ",
    labelAr: "صالح",
    category: "prophet",
    note: "صالح is also the ordinary adjective \"righteous\"; this corpus doesn't distinguish the two senses, so some matches are the adjective, not the prophet's name.",
    sources: [rootedLemma("صلح", "صالح")],
  },
  {
    slug: "shuaib",
    labelEn: "Shuʿayb",
    labelAr: "شعيب",
    category: "prophet",
    sources: [rootlessLemma("شعيب")],
  },
  {
    slug: "idris",
    labelEn: "Idrīs",
    labelAr: "إدريس",
    category: "prophet",
    sources: [rootlessLemma("ادريس")],
  },
  {
    slug: "ilyas",
    labelEn: "Ilyās (Elijah)",
    labelAr: "إلياس",
    category: "prophet",
    sources: [rootlessLemma("الياس")],
  },
  {
    slug: "al-yasa",
    labelEn: "Al-Yasaʿ (Elisha)",
    labelAr: "اليسع",
    category: "prophet",
    sources: [rootlessLemma("اليسع")],
  },
  {
    slug: "zakariya",
    labelEn: "Zakariyyā (Zechariah)",
    labelAr: "زكريا",
    category: "prophet",
    sources: [rootlessLemma("زكريا")],
  },
  {
    slug: "yahya",
    labelEn: "Yaḥyā (John)",
    labelAr: "يحيى",
    category: "prophet",
    sources: [rootedLemma("حيي", "يحيي")],
  },
  { slug: "isa", labelEn: "ʿĪsā (Jesus)", labelAr: "عيسى", category: "prophet", sources: [rootlessLemma("عيسي")] },
  {
    slug: "muhammad",
    labelEn: "Muḥammad",
    labelAr: "محمد",
    category: "prophet",
    note: "Includes both names the Qur'an uses for him: محمد and أحمد (61:6).",
    sources: [rootedLemma("حمد", "محمد"), rootedLemma("حمد", "احمد")],
  },
];

export const ALL_TOPICS: TopicDefinition[] = [...THEME_TOPICS, ...PROPHET_TOPICS];

export function findTopicBySlug(slug: string): TopicDefinition | undefined {
  return ALL_TOPICS.find((t) => t.slug === slug);
}
