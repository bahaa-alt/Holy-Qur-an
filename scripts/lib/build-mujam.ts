import type { MujamMetaFile, MujamRootFile, MujamWork } from "../../src/lib/data/types";
import { encodeMujamToken, parseMujamEntry } from "./parse-mujam";

/** One dictionary row as the source database stores it. */
export interface RawMujamEntry {
  /** headword, which in these three works is the root, unvocalised */
  word: string;
  /** the article body */
  meanings: string;
}

/**
 * The three Arabic-Arabic lexicons, and the printed edition each text is.
 *
 * Every one is a pre-1500 work, so the text itself is long out of copyright.
 * What matters for a research tool is not that but ATTRIBUTION: a digital
 * text nobody can trace to an edition cannot be cited, and the database
 * these come from names no edition at all.
 *
 * So each was identified by cross-matching against OpenITI -- the
 * Aga Khan / Vienna / Maryland scholarly corpus, which does record the
 * edition behind every text. Diacritics and orthography were stripped from
 * both sides and entries spread through each work were checked for verbatim
 * overlap: Maqāyīs 33/33, Mufradāt 39/40, al-Ṣiḥāḥ 35/36. The editions named
 * in `edition` below are the ones those texts matched, and `openiti` is the
 * version that attests it.
 *
 * The identification runs the other way from how it is used: OpenITI
 * supplies the provenance, this database supplies the text, because OpenITI
 * strips vocalisation entirely (0 marks in 1.5M letters) and a lexicon whose
 * Arabic is unvowelled is much harder to read. Neither source alone would
 * do.
 *
 * DELIBERATELY EXCLUDED from the same database: Hans Wehr, al-Muʿjam
 * al-Wasīṭ, al-Muʿjam al-Muʿāṣir and al-Ghanī are modern works still in
 * copyright, redistributed there under a licence their packager has no
 * standing to grant. One of them is labelled "al-Muḥīṭ", which reads like
 * al-Fīrūzābādī's 15th-century Qāmūs and is not: its articles use تلفزيون,
 * ديمقراطية, سينما and كهرباء, and it is keyed by inflected form rather than
 * by root. It is not here.
 */
export const MUJAM_WORKS: readonly MujamWork[] = [
  {
    id: "maqayis",
    title: "معجم مقاييس اللغة",
    titleEn: "Muʿjam Maqāyīs al-Lugha",
    author: "أحمد بن فارس بن زكريا",
    authorEn: "Ibn Fāris (d. 395/1004)",
    died: "395 AH / 1004 CE",
    edition: "تحقيق عبد السلام محمد هارون، دار الفكر، ١٣٩٩هـ/١٩٧٩م",
    editionEn: "ed. ʿAbd al-Salām Muḥammad Hārūn, Dār al-Fikr, 1399/1979",
    openiti: "0395IbnFarisQazwini.MucjamMaqayis.Shamela0021710-ara1",
    /** why a root researcher wants this one first */
    note: "يردّ كل مادة إلى أصل واحد أو أصول معدودة",
    noteEn: "Derives each root from one or a few core senses",
    coveredRoots: 0,
  },
  {
    id: "mufradat",
    title: "المفردات في غريب القرآن",
    titleEn: "al-Mufradāt fī Gharīb al-Qurʾān",
    author: "الراغب الأصفهاني",
    authorEn: "al-Rāghib al-Iṣfahānī (d. 502/1108)",
    died: "502 AH / 1108 CE",
    edition: "تحقيق صفوان عدنان الداودي، دار القلم والدار الشامية، دمشق وبيروت",
    editionEn: "ed. Ṣafwān ʿAdnān Dāwūdī, Dār al-Qalam / al-Dār al-Shāmiyya, Damascus–Beirut",
    openiti: "0502RaghibIsbahani.Mufradat.Shamela0023636-ara1",
    note: "معجم خاص بألفاظ القرآن، مرتب على الجذور",
    noteEn: "A lexicon of Qurʾānic vocabulary specifically, ordered by root",
    coveredRoots: 0,
  },
  {
    id: "sihah",
    title: "الصحاح تاج اللغة وصحاح العربية",
    titleEn: "al-Ṣiḥāḥ: Tāj al-Lugha wa-Ṣiḥāḥ al-ʿArabiyya",
    author: "إسماعيل بن حماد الجوهري",
    authorEn: "al-Jawharī (d. 393/1003)",
    died: "393 AH / 1003 CE",
    edition: "تحقيق أحمد عبد الغفور عطار، دار العلم للملايين، بيروت، الطبعة الرابعة ١٤٠٧هـ/١٩٨٧م",
    editionEn:
      "ed. Aḥmad ʿAbd al-Ghafūr ʿAṭṭār, Dār al-ʿIlm li-l-Malāyīn, Beirut, 4th ed. 1407/1987",
    openiti: "0393IbnHammadJawhari.SihahTajLugha.Shamela0023235-ara1",
    note: "من أوثق المعاجم في ضبط الصحيح من كلام العرب",
    noteEn: "The standard authority for what is soundly attested in classical usage",
    coveredRoots: 0,
  },
];

/**
 * Which table of the source database each work's text lives in.
 *
 * Separate from MUJAM_WORKS so that constant is exactly the shipped
 * MujamWork shape: where the text was read from at build time is not
 * something a reader of the panel needs, and keeping it here means nothing
 * has to be stripped on the way out.
 */
export const MUJAM_SOURCE_TABLE: Record<MujamWork["id"], string> = {
  maqayis: "maqayeesul_luga",
  mufradat: "mufradat_alfajul_quran",
  sihah: "mujamul_shihah",
};

/**
 * Normalises a root for matching between this corpus and these lexicons.
 *
 * Identical in intent to build-lane.ts's `normalizeRoot`, and separate from
 * it on purpose: these sources also carry vocalisation on their headwords,
 * which Lane's database does not, so the diacritic strip is needed here and
 * would be dead code there.
 */
export function normalizeMujamRoot(root: string): string {
  return root
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآء]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

/**
 * Every spelling of `root` worth looking for, most faithful first.
 *
 * The same two transformations `laneCandidates` allows, and for the same
 * reason -- these lexicons contract a doubled-final root (أبب → اب) exactly
 * as Lane does. And the same one deliberately refused: substituting a final
 * weak letter would map دهق onto دهو, which is a different root, and
 * attaching another root's article to this one would be a fabricated
 * attribution.
 */
export function mujamCandidates(root: string): string[] {
  const n = normalizeMujamRoot(root);
  const out = [n];
  if (n.length >= 3 && n[n.length - 1] === n[n.length - 2]) out.push(n.slice(0, -1));
  if (n.length === 4 && n[0] === n[2] && n[1] === n[3]) out.push(n.slice(0, 2));
  return out;
}

/**
 * Builds one shard per corpus root, carrying every work that covers it.
 *
 * Sharded by ROOT rather than by work because that is the access pattern: a
 * root page opens all three at once, and three fetches for one panel would
 * be three round trips. Averages ~6 KB a shard.
 *
 * Coverage is partial and differs per work -- Mufradāt is the narrowest at
 * 85.4%, because it is a lexicon of Qurʾānic vocabulary and not every root
 * in this corpus got an article. A root a work does not cover is simply
 * absent from that shard; nothing is substituted from a neighbouring root.
 */
export function buildMujam(
  entriesByWork: ReadonlyMap<string, readonly RawMujamEntry[]>,
  corpusRoots: readonly string[],
): { meta: MujamMetaFile; files: Map<string, MujamRootFile> } {
  // Index each work's headwords by normalised spelling once. A work may
  // print two articles under one root (al-Ṣiḥāḥ does); both are kept, in
  // source order.
  const indexed = new Map<string, Map<string, RawMujamEntry[]>>();
  for (const work of MUJAM_WORKS) {
    const byKey = new Map<string, RawMujamEntry[]>();
    for (const row of entriesByWork.get(work.id) ?? []) {
      if (!row.word || !row.meanings?.trim()) continue;
      const key = normalizeMujamRoot(row.word);
      if (!key) continue;
      const list = byKey.get(key);
      if (list) list.push(row);
      else byKey.set(key, [row]);
    }
    indexed.set(work.id, byKey);
  }

  const files = new Map<string, MujamRootFile>();
  const uncovered: string[] = [];
  const covered = new Map<string, number>(MUJAM_WORKS.map((w) => [w.id, 0]));

  for (const root of corpusRoots) {
    const entries: MujamRootFile["entries"] = [];

    for (const work of MUJAM_WORKS) {
      const byKey = indexed.get(work.id)!;
      const key = mujamCandidates(root).find((c) => byKey.has(c));
      if (key === undefined) continue;

      const articles = (byKey.get(key) ?? [])
        .map((row) => ({
          headword: row.word,
          tokens: parseMujamEntry(row.meanings).map(encodeMujamToken),
        }))
        .filter((a) => a.tokens.length > 0);
      if (articles.length === 0) continue;

      covered.set(work.id, covered.get(work.id)! + 1);
      entries.push({
        work: work.id,
        spelling: key === normalizeMujamRoot(root) ? null : key,
        articles,
      });
    }

    if (entries.length === 0) uncovered.push(root);
    else files.set(root, { root, entries });
  }

  return {
    meta: {
      works: MUJAM_WORKS.map((w) => ({ ...w, coveredRoots: covered.get(w.id)! })),
      coveredRoots: files.size,
      totalRoots: corpusRoots.length,
      uncoveredRoots: uncovered.sort(),
    },
    files,
  };
}
